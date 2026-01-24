import { PrismaClient } from "@workspace/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationService } from "./invitation.service.js";

const mockPrisma = {
  $transaction: vi.fn((callback) => callback(mockPrisma)),
  $extends: vi.fn().mockReturnThis(),
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  centerMembership: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as unknown as PrismaClient;

const mockResend = {
  emails: {
    send: vi.fn(),
  },
};

describe("InvitationService", () => {
  let invitationService: InvitationService;

  beforeEach(() => {
    vi.clearAllMocks();
    invitationService = new InvitationService(mockPrisma, mockResend as any, {
      emailFrom: "test@classlite.app",
      webappUrl: "http://localhost:3000",
    });
  });

  it("should create a new user and invitation if user doesn't exist", async () => {
    const centerId = "center-123";
    const email = "new@test.com";
    const role = "TEACHER" as const;

    (mockPrisma.centerMembership.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.create as any).mockResolvedValue({
      id: "user-456",
      email,
    });
    (mockPrisma.centerMembership.create as any).mockResolvedValue({
      id: "mem-789",
      centerId,
      userId: "user-456",
      role,
      status: "INVITED",
    });

    const result = await invitationService.inviteUser(centerId, {
      email,
      role,
    });
  });

  it("should create a new user and invitation if user doesn't exist", async () => {
    const centerId = "center-123";
    const email = "new@test.com";
    const role = "TEACHER" as const;

    (mockPrisma.centerMembership.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.create as any).mockResolvedValue({
      id: "user-456",
      email,
    });
    (mockPrisma.centerMembership.create as any).mockResolvedValue({
      id: "mem-789",
      centerId,
      userId: "user-456",
      role,
      status: "INVITED",
    });

    const result = await invitationService.inviteUser(centerId, {
      email,
      role,
    });

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email },
    });
    expect(mockPrisma.centerMembership.create).toHaveBeenCalledWith({
      data: {
        centerId,
        userId: "user-456",
        role: "TEACHER",
        status: "INVITED",
      },
    });
    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        subject: expect.stringContaining("invited"),
        html: expect.stringContaining("http://localhost:3000/sign-up"),
      }),
    );
    expect(result.status).toBe("INVITED");
  });

  it("should throw error if user is already a member of this center", async () => {
    const centerId = "center-123";
    const email = "already@member.com";
    const role = "STUDENT" as const;

    (mockPrisma.user.findUnique as any).mockResolvedValue({
      id: "user-123",
      email,
    });
    (mockPrisma.centerMembership.findUnique as any).mockResolvedValue({
      id: "mem-123",
      centerId,
      userId: "user-123",
    });

    await expect(
      invitationService.inviteUser(centerId, { email, role }),
    ).rejects.toThrow("User is already a member of this center");
  });
});
