import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserListQuery } from "@workspace/types";

// Mock firebase-admin at module level
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    revokeRefreshTokens: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock data structure
const createMockTenantedClient = () => ({
  centerMembership: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
});

const createMockPrisma = () => ({
  authAccount: {
    findFirst: vi.fn(),
  },
});

// Create mock instances
let mockTenantedClient = createMockTenantedClient();
let mockPrisma = createMockPrisma();

// Mock @workspace/db at module level
vi.mock("@workspace/db", () => ({
  getTenantedClient: vi.fn(() => mockTenantedClient),
  PrismaClient: vi.fn(() => mockPrisma),
  CenterRole: { OWNER: "OWNER", ADMIN: "ADMIN", TEACHER: "TEACHER", STUDENT: "STUDENT" },
  MembershipStatus: { ACTIVE: "ACTIVE", SUSPENDED: "SUSPENDED", INVITED: "INVITED" },
}));

// Import after mocks are set up
import { UsersService } from "./users.service.js";

describe("UsersService", () => {
  let usersService: UsersService;

  const centerId = "test-center-id";
  const userId = "test-user-id";
  const requestingUserId = "requesting-user-id";

  beforeEach(() => {
    // Reset mocks
    mockTenantedClient = createMockTenantedClient();
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();

    usersService = new UsersService(mockPrisma as any);
  });

  describe("listUsers", () => {
    it("returns paginated users with correct structure", async () => {
      const mockMemberships = [
        {
          id: "mem-1",
          userId: "user-1",
          centerId,
          role: "TEACHER",
          status: "ACTIVE",
          createdAt: new Date("2024-01-01"),
          user: {
            id: "user-1",
            email: "teacher@test.com",
            name: "Teacher One",
            avatarUrl: null,
            updatedAt: new Date("2024-01-15"),
          },
        },
      ];

      mockTenantedClient.centerMembership.findMany.mockResolvedValue(mockMemberships);
      mockTenantedClient.centerMembership.count.mockResolvedValue(1);

      const query: UserListQuery = { page: 1, limit: 10 };
      const result = await usersService.listUsers(centerId, query);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: "user-1",
        email: "teacher@test.com",
        name: "Teacher One",
        role: "TEACHER",
        status: "ACTIVE",
      });
      expect(result.total).toBe(1);
    });

    it("applies search filter correctly", async () => {
      mockTenantedClient.centerMembership.findMany.mockResolvedValue([]);
      mockTenantedClient.centerMembership.count.mockResolvedValue(0);

      const query: UserListQuery = { page: 1, limit: 10, search: "john" };
      await usersService.listUsers(centerId, query);

      expect(mockTenantedClient.centerMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: {
              OR: [
                { email: { contains: "john", mode: "insensitive" } },
                { name: { contains: "john", mode: "insensitive" } },
              ],
            },
          }),
        })
      );
    });

    it("applies role filter correctly", async () => {
      mockTenantedClient.centerMembership.findMany.mockResolvedValue([]);
      mockTenantedClient.centerMembership.count.mockResolvedValue(0);

      const query: UserListQuery = { page: 1, limit: 10, role: "TEACHER" };
      await usersService.listUsers(centerId, query);

      expect(mockTenantedClient.centerMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: "TEACHER",
          }),
        })
      );
    });

    it("applies status filter correctly", async () => {
      mockTenantedClient.centerMembership.findMany.mockResolvedValue([]);
      mockTenantedClient.centerMembership.count.mockResolvedValue(0);

      const query: UserListQuery = { page: 1, limit: 10, status: "ACTIVE" };
      await usersService.listUsers(centerId, query);

      expect(mockTenantedClient.centerMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("calculates correct pagination offset", async () => {
      mockTenantedClient.centerMembership.findMany.mockResolvedValue([]);
      mockTenantedClient.centerMembership.count.mockResolvedValue(0);

      const query: UserListQuery = { page: 3, limit: 10 };
      await usersService.listUsers(centerId, query);

      expect(mockTenantedClient.centerMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      );
    });
  });

  describe("changeRole", () => {
    it("successfully changes user role", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId,
        role: "TEACHER",
      });
      mockTenantedClient.centerMembership.update.mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });

      const result = await usersService.changeRole(centerId, userId, { role: "ADMIN" });

      expect(result).toEqual({ id: userId, role: "ADMIN" });
    });

    it("throws error when user not found", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue(null);

      await expect(
        usersService.changeRole(centerId, userId, { role: "ADMIN" })
      ).rejects.toThrow("User not found in this center");
    });

    it("throws error when trying to change OWNER role", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId,
        role: "OWNER",
      });

      await expect(
        usersService.changeRole(centerId, userId, { role: "ADMIN" })
      ).rejects.toThrow("Cannot change role of an owner");
    });
  });

  describe("deactivateUser", () => {
    it("successfully deactivates user", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId,
        role: "TEACHER",
        user: { firebaseUid: "firebase-123" },
      });
      mockTenantedClient.centerMembership.update.mockResolvedValue({
        id: "mem-1",
        status: "SUSPENDED",
      });
      mockPrisma.authAccount.findFirst.mockResolvedValue({
        providerUserId: "firebase-123",
      });

      const result = await usersService.deactivateUser(centerId, userId, requestingUserId);

      expect(result).toEqual({ id: userId, status: "SUSPENDED" });
    });

    it("throws error when trying to deactivate self", async () => {
      await expect(
        usersService.deactivateUser(centerId, userId, userId)
      ).rejects.toThrow("Cannot deactivate yourself");
    });

    it("throws error when user not found", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue(null);

      await expect(
        usersService.deactivateUser(centerId, userId, requestingUserId)
      ).rejects.toThrow("User not found in this center");
    });

    it("throws error when trying to deactivate the last OWNER", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId,
        role: "OWNER",
        user: {},
      });
      mockTenantedClient.centerMembership.count.mockResolvedValue(1); // Only 1 active owner

      await expect(
        usersService.deactivateUser(centerId, userId, requestingUserId)
      ).rejects.toThrow("Cannot deactivate the last owner");
    });

    it("allows deactivating an OWNER if there are multiple active owners", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId,
        role: "OWNER",
        user: { firebaseUid: "firebase-123" },
      });
      mockTenantedClient.centerMembership.count.mockResolvedValue(2); // 2 active owners
      mockTenantedClient.centerMembership.update.mockResolvedValue({
        id: "mem-1",
        status: "SUSPENDED",
      });
      mockPrisma.authAccount.findFirst.mockResolvedValue(null);

      const result = await usersService.deactivateUser(centerId, userId, requestingUserId);

      expect(result).toEqual({ id: userId, status: "SUSPENDED" });
    });
  });

  describe("reactivateUser", () => {
    it("successfully reactivates user", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId,
        status: "SUSPENDED",
      });
      mockTenantedClient.centerMembership.update.mockResolvedValue({
        id: "mem-1",
        status: "ACTIVE",
      });

      const result = await usersService.reactivateUser(centerId, userId);

      expect(result).toEqual({ id: userId, status: "ACTIVE" });
    });

    it("throws error when user not found", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue(null);

      await expect(
        usersService.reactivateUser(centerId, userId)
      ).rejects.toThrow("User not found in this center");
    });
  });

  describe("bulkDeactivate", () => {
    it("processes multiple users correctly", async () => {
      mockTenantedClient.centerMembership.findFirst
        .mockResolvedValueOnce({ id: "mem-1", userId: "user-1", role: "TEACHER" })
        .mockResolvedValueOnce({ id: "mem-2", userId: "user-2", role: "STUDENT" });
      mockTenantedClient.centerMembership.update.mockResolvedValue({ status: "SUSPENDED" });
      mockPrisma.authAccount.findFirst.mockResolvedValue(null);

      const result = await usersService.bulkDeactivate(
        centerId,
        { userIds: ["user-1", "user-2"] },
        requestingUserId
      );

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("skips OWNER users in bulk deactivation", async () => {
      mockTenantedClient.centerMembership.findFirst.mockResolvedValue({
        id: "mem-1",
        userId: "user-1",
        role: "OWNER",
      });

      const result = await usersService.bulkDeactivate(
        centerId,
        { userIds: ["user-1"] },
        requestingUserId
      );

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });

    it("skips self in bulk deactivation", async () => {
      const result = await usersService.bulkDeactivate(
        centerId,
        { userIds: [requestingUserId] },
        requestingUserId
      );

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe("listInvitations", () => {
    it("returns all invitations when no status filter", async () => {
      const mockMemberships = [
        {
          id: "mem-1",
          userId: "user-1",
          role: "TEACHER",
          status: "INVITED",
          createdAt: new Date("2024-01-01"),
          user: { email: "teacher@test.com" },
        },
      ];
      mockTenantedClient.centerMembership.findMany.mockResolvedValue(mockMemberships);

      const result = await usersService.listInvitations(centerId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        email: "teacher@test.com",
        role: "TEACHER",
        status: "INVITED",
      });
    });

    it("filters by status when provided", async () => {
      mockTenantedClient.centerMembership.findMany.mockResolvedValue([]);

      await usersService.listInvitations(centerId, "INVITED");

      expect(mockTenantedClient.centerMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "INVITED" },
        })
      );
    });
  });

  describe("resendInvitation", () => {
    it("returns invitation status on success", async () => {
      mockTenantedClient.centerMembership.findUnique.mockResolvedValue({
        id: "inv-1",
        status: "INVITED",
        user: { email: "test@example.com" },
      });

      const result = await usersService.resendInvitation(centerId, "inv-1");

      expect(result).toEqual({ id: "inv-1", status: "INVITED" });
    });

    it("throws error when invitation not found", async () => {
      mockTenantedClient.centerMembership.findUnique.mockResolvedValue(null);

      await expect(
        usersService.resendInvitation(centerId, "inv-1")
      ).rejects.toThrow("Invitation not found");
    });

    it("throws error when user already accepted invitation", async () => {
      mockTenantedClient.centerMembership.findUnique.mockResolvedValue({
        id: "inv-1",
        status: "ACTIVE",
        user: { email: "test@example.com" },
      });

      await expect(
        usersService.resendInvitation(centerId, "inv-1")
      ).rejects.toThrow("User has already accepted the invitation");
    });
  });

  describe("revokeInvitation", () => {
    it("deletes invitation on success", async () => {
      mockTenantedClient.centerMembership.findUnique.mockResolvedValue({
        id: "inv-1",
        status: "INVITED",
      });
      mockTenantedClient.centerMembership.delete.mockResolvedValue({});

      await usersService.revokeInvitation(centerId, "inv-1");

      expect(mockTenantedClient.centerMembership.delete).toHaveBeenCalledWith({
        where: { id: "inv-1" },
      });
    });

    it("throws error when invitation not found", async () => {
      mockTenantedClient.centerMembership.findUnique.mockResolvedValue(null);

      await expect(
        usersService.revokeInvitation(centerId, "inv-1")
      ).rejects.toThrow("Invitation not found");
    });

    it("throws error when user already accepted", async () => {
      mockTenantedClient.centerMembership.findUnique.mockResolvedValue({
        id: "inv-1",
        status: "ACTIVE",
      });

      await expect(
        usersService.revokeInvitation(centerId, "inv-1")
      ).rejects.toThrow("Cannot revoke - user has already accepted the invitation");
    });
  });
});
