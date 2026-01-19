import { PrismaClient } from "@workspace/db";
import { CreateTenantInput } from "@workspace/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantService } from "./tenant.service.js";

// Mock external dependencies
const mockPrisma = {
  $transaction: vi.fn((callback) => callback(mockPrisma)),
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
  },
  centerMembership: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

const mockFirebaseAuth = {
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  setCustomUserClaims: vi.fn(),
  generatePasswordResetLink: vi.fn(),
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
      mockResend as any,
      { emailFrom: "test@classlite.app" },
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
    });
    (mockPrisma.center.create as any).mockResolvedValue({
      id: "center-id-123",
      name: input.name,
      slug: input.slug,
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
