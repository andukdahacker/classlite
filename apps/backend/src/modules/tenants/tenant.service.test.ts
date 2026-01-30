import { PrismaClient } from "@workspace/db";
import { CreateTenantInput, UpdateCenterInput } from "@workspace/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantService } from "./tenant.service.js";

// Mock external dependencies
const mockPrisma = {
  $transaction: vi.fn((callback) => callback(mockPrisma)),
  // $extends returns the mock itself since we're not testing tenanting logic here
  $extends: vi.fn(() => mockPrisma),
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  authAccount: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  center: {
    create: vi.fn(),
    update: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  centerMembership: {
    create: vi.fn(),
    findFirstOrThrow: vi.fn(),
  },
} as unknown as PrismaClient;

const mockFirebaseAuth = {
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  setCustomUserClaims: vi.fn(),
  generatePasswordResetLink: vi.fn(),
};

const mockFirebaseStorage = {
  bucket: vi.fn().mockReturnValue({
    file: vi.fn().mockReturnValue({
      save: vi.fn().mockResolvedValue(undefined),
      makePublic: vi.fn().mockResolvedValue(undefined),
    }),
    name: "test-bucket",
  }),
};

const mockResend = {
  emails: {
    send: vi.fn(),
  },
};

describe("TenantService", () => {
  let tenantService: TenantService;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantService = new TenantService(
      mockPrisma,
      mockFirebaseAuth as any,
      mockFirebaseStorage as any,
      mockResend as any,
      { emailFrom: "test@classlite.app", bucketName: "test-bucket" },
    );
  });

  it("should create a new tenant, user, and send welcome email", async () => {
    // Arrange
    const input: CreateTenantInput = {
      name: "Test Center",
      slug: "test-center",
      ownerEmail: "owner@test.com",
      ownerName: "Test Owner",
    };

    // Mocks
    mockFirebaseAuth.getUserByEmail.mockRejectedValue({
      code: "auth/user-not-found",
    });
    mockFirebaseAuth.createUser.mockResolvedValue({ uid: "firebase-uid-123" });
    mockFirebaseAuth.generatePasswordResetLink.mockResolvedValue(
      "https://reset-link.com",
    );

    // Prisma mocks
    (mockPrisma.user.findUnique as any).mockResolvedValue(null); // User doesn't exist in DB
    (mockPrisma.authAccount.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.create as any).mockResolvedValue({
      id: "user-id-123",
      email: input.ownerEmail,
      name: input.ownerName,
    });
    (mockPrisma.center.create as any).mockResolvedValue({
      id: "center-id-123",
      name: input.name,
      slug: input.slug,
      logoUrl: null,
      timezone: "UTC",
      brandColor: "#2563EB",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Act
    const result = await tenantService.createTenant(input);

    // Assert
    expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith({
      email: input.ownerEmail,
      displayName: input.ownerName,
      emailVerified: true, // Auto-verify since admin created it
    });

    expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith(
      "firebase-uid-123",
      {
        center_id: "center-id-123",
        role: "owner",
      },
    );

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.center.create).toHaveBeenCalled();
    expect(mockPrisma.centerMembership.create).toHaveBeenCalledWith({
      data: {
        centerId: "center-id-123",
        userId: "user-id-123",
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: input.ownerEmail,
        subject: "Welcome to ClassLite",
        html: expect.stringContaining("https://reset-link.com"),
      }),
    );

    expect(result).toBeDefined();
    expect(result.center.id).toBe("center-id-123");
  });

  it("should update tenant details", async () => {
    // Arrange
    const centerId = "center-id-123";
    const input: UpdateCenterInput = {
      name: "Updated Center",
      brandColor: "#FF0000",
    };

    (mockPrisma.center.update as any).mockResolvedValue({
      id: centerId,
      name: input.name,
      slug: "test-center",
      logoUrl: "http://logo.com",
      timezone: "UTC",
      brandColor: input.brandColor,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (mockPrisma.centerMembership.findFirstOrThrow as any).mockResolvedValue({
      user: {
        id: "user-id-123",
        email: "owner@test.com",
        name: "Test Owner",
      },
    });

    // Act
    const result = await tenantService.updateTenant(centerId, input);

    // Assert
    expect(mockPrisma.center.update).toHaveBeenCalledWith({
      where: { id: centerId },
      data: {
        name: input.name,
        logoUrl: undefined,
        timezone: undefined,
        brandColor: input.brandColor,
      },
    });
    expect(result.center.name).toBe(input.name);
    expect(result.center.brandColor).toBe(input.brandColor);
  });

  it("should upload logo and update center", async () => {
    // Arrange
    const centerId = "center-id-123";
    const fileBuffer = Buffer.from("test-file");
    const contentType = "image/png";

    // Act
    const logoUrl = await tenantService.uploadLogo(
      centerId,
      fileBuffer,
      contentType,
    );

    // Assert
    expect(mockFirebaseStorage.bucket).toHaveBeenCalled();
    expect(mockPrisma.center.update).toHaveBeenCalledWith({
      where: { id: centerId },
      data: {
        logoUrl: expect.stringContaining(
          `tenants/${centerId}/branding/logo.png`,
        ),
      },
    });
    expect(logoUrl).toContain(`tenants/${centerId}/branding/logo.png`);
  });

  it("should throw error if center creation fails", async () => {
    // Arrange
    const input: CreateTenantInput = {
      name: "Test Center",
      slug: "test-center",
      ownerEmail: "owner@test.com",
      ownerName: "Test Owner",
    };

    mockFirebaseAuth.getUserByEmail.mockRejectedValue({
      code: "auth/user-not-found",
    });
    mockFirebaseAuth.createUser.mockResolvedValue({ uid: "firebase-uid-123" });

    // Simulate transaction failure
    (mockPrisma.$transaction as any).mockRejectedValue(
      new Error("Database error"),
    );

    // Act & Assert
    await expect(tenantService.createTenant(input)).rejects.toThrow(
      "Database error",
    );

    expect(mockFirebaseAuth.deleteUser).toHaveBeenCalledWith(
      "firebase-uid-123",
    );
  });
});
