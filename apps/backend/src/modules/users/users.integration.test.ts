import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient, CenterRole, MembershipStatus } from "@workspace/db";
import { getTestPrisma, closeTestPrisma, isTestDatabaseAvailable } from "../../test/db.js";

// Mock Firebase Admin before any imports
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    revokeRefreshTokens: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { UsersService } from "./users.service.js";

describe("Users Integration", () => {
  let prisma: PrismaClient;
  let dbAvailable = false;
  let usersService: UsersService;

  const centerAId = "center-users-a";
  const centerBId = "center-users-b";
  const ownerUserId = "owner-user-id";
  const teacherUserId = "teacher-user-id";
  const studentUserId = "student-user-id";
  const invitedUserId = "invited-user-id";

  beforeAll(async () => {
    dbAvailable = await isTestDatabaseAvailable();
    if (dbAvailable) {
      prisma = await getTestPrisma();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    try {
      usersService = new UsersService(prisma);

      // Cleanup - order matters for foreign keys
      await prisma.centerMembership.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [ownerUserId, teacherUserId, studentUserId, invitedUserId] } },
      });
      await prisma.center.deleteMany({
        where: { id: { in: [centerAId, centerBId] } },
      });

      // Setup centers
      await prisma.center.create({
        data: { id: centerAId, name: "Center A", slug: "center-users-a" },
      });
      await prisma.center.create({
        data: { id: centerBId, name: "Center B", slug: "center-users-b" },
      });

      // Setup users
      await prisma.user.createMany({
        data: [
          { id: ownerUserId, email: "owner@test.com", name: "Owner User" },
          { id: teacherUserId, email: "teacher@test.com", name: "Teacher User" },
          { id: studentUserId, email: "student@test.com", name: "Student User" },
          { id: invitedUserId, email: "invited@test.com", name: "Invited User" },
        ],
      });

      // Setup memberships for Center A
      await prisma.centerMembership.createMany({
        data: [
          { centerId: centerAId, userId: ownerUserId, role: CenterRole.OWNER, status: MembershipStatus.ACTIVE },
          { centerId: centerAId, userId: teacherUserId, role: CenterRole.TEACHER, status: MembershipStatus.ACTIVE },
          { centerId: centerAId, userId: studentUserId, role: CenterRole.STUDENT, status: MembershipStatus.ACTIVE },
          { centerId: centerAId, userId: invitedUserId, role: CenterRole.STUDENT, status: MembershipStatus.INVITED },
        ],
      });
    } catch (e) {
      console.warn("Database integration test setup failed:", e);
    }
  });

  afterAll(async () => {
    if (dbAvailable && prisma) {
      try {
        // Cleanup
        await prisma.centerMembership.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [ownerUserId, teacherUserId, studentUserId, invitedUserId] } },
        });
        await prisma.center.deleteMany({
          where: { id: { in: [centerAId, centerBId] } },
        });
      } catch {}
    }
    await closeTestPrisma();
  });

  describe("User List API with Pagination (AC: 1, 2)", () => {
    it("lists users with correct pagination", async () => {
      if (!dbAvailable) return;

      const result = await usersService.listUsers(centerAId, { page: 1, limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(4);
    });

    it("respects page parameter for offset", async () => {
      if (!dbAvailable) return;

      const page1 = await usersService.listUsers(centerAId, { page: 1, limit: 2 });
      const page2 = await usersService.listUsers(centerAId, { page: 2, limit: 2 });

      // Different users on different pages
      const page1Ids = page1.items.map((u) => u.id);
      const page2Ids = page2.items.map((u) => u.id);
      expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
    });

    it("filters by role correctly", async () => {
      if (!dbAvailable) return;

      const result = await usersService.listUsers(centerAId, {
        page: 1,
        limit: 10,
        role: "TEACHER",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role).toBe("TEACHER");
    });

    it("filters by status correctly", async () => {
      if (!dbAvailable) return;

      const result = await usersService.listUsers(centerAId, {
        page: 1,
        limit: 10,
        status: "INVITED",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("INVITED");
    });

    it("searches by name", async () => {
      if (!dbAvailable) return;

      const result = await usersService.listUsers(centerAId, {
        page: 1,
        limit: 10,
        search: "Teacher",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Teacher User");
    });

    it("searches by email", async () => {
      if (!dbAvailable) return;

      const result = await usersService.listUsers(centerAId, {
        page: 1,
        limit: 10,
        search: "student@",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe("student@test.com");
    });

    it("respects tenant isolation - cannot see other center's users", async () => {
      if (!dbAvailable) return;

      const resultB = await usersService.listUsers(centerBId, { page: 1, limit: 10 });

      // Center B should have no users
      expect(resultB.items).toHaveLength(0);
    });
  });

  describe("Role Change with RBAC (AC: 5, 6)", () => {
    it("successfully changes role from TEACHER to ADMIN", async () => {
      if (!dbAvailable) return;

      const result = await usersService.changeRole(centerAId, teacherUserId, {
        role: "ADMIN",
      });

      expect(result.role).toBe("ADMIN");

      // Verify in database
      const membership = await prisma.centerMembership.findFirst({
        where: { userId: teacherUserId, centerId: centerAId },
      });
      expect(membership?.role).toBe("ADMIN");
    });

    it("prevents changing OWNER role", async () => {
      if (!dbAvailable) return;

      await expect(
        usersService.changeRole(centerAId, ownerUserId, { role: "ADMIN" })
      ).rejects.toThrow("Cannot change role of an owner");
    });

    it("throws error for non-existent user", async () => {
      if (!dbAvailable) return;

      await expect(
        usersService.changeRole(centerAId, "non-existent-user", { role: "ADMIN" })
      ).rejects.toThrow("User not found in this center");
    });
  });

  describe("Deactivation/Reactivation with Session Invalidation (AC: 7)", () => {
    it("deactivates user and updates status to SUSPENDED", async () => {
      if (!dbAvailable) return;

      const result = await usersService.deactivateUser(
        centerAId,
        studentUserId,
        ownerUserId
      );

      expect(result.status).toBe("SUSPENDED");

      // Verify in database
      const membership = await prisma.centerMembership.findFirst({
        where: { userId: studentUserId, centerId: centerAId },
      });
      expect(membership?.status).toBe("SUSPENDED");
    });

    it("prevents deactivating yourself", async () => {
      if (!dbAvailable) return;

      await expect(
        usersService.deactivateUser(centerAId, ownerUserId, ownerUserId)
      ).rejects.toThrow("Cannot deactivate yourself");
    });

    it("prevents deactivating the last OWNER", async () => {
      if (!dbAvailable) return;

      await expect(
        usersService.deactivateUser(centerAId, ownerUserId, teacherUserId)
      ).rejects.toThrow("Cannot deactivate the last owner");
    });

    it("reactivates a suspended user", async () => {
      if (!dbAvailable) return;

      // First deactivate
      await usersService.deactivateUser(centerAId, studentUserId, ownerUserId);

      // Then reactivate
      const result = await usersService.reactivateUser(centerAId, studentUserId);

      expect(result.status).toBe("ACTIVE");

      // Verify in database
      const membership = await prisma.centerMembership.findFirst({
        where: { userId: studentUserId, centerId: centerAId },
      });
      expect(membership?.status).toBe("ACTIVE");
    });
  });

  describe("Invitation CRUD Operations (AC: 3, 4)", () => {
    it("lists pending invitations", async () => {
      if (!dbAvailable) return;

      const invitations = await usersService.listInvitations(centerAId, "INVITED");

      expect(invitations).toHaveLength(1);
      expect(invitations[0].email).toBe("invited@test.com");
      expect(invitations[0].status).toBe("INVITED");
    });

    it("revokes an invitation", async () => {
      if (!dbAvailable) return;

      // Get the membership ID for the invited user
      const membership = await prisma.centerMembership.findFirst({
        where: { userId: invitedUserId, centerId: centerAId },
      });

      await usersService.revokeInvitation(centerAId, membership!.id);

      // Verify invitation is deleted
      const deletedMembership = await prisma.centerMembership.findUnique({
        where: { id: membership!.id },
      });
      expect(deletedMembership).toBeNull();
    });

    it("prevents revoking invitation for active user", async () => {
      if (!dbAvailable) return;

      const membership = await prisma.centerMembership.findFirst({
        where: { userId: teacherUserId, centerId: centerAId },
      });

      await expect(
        usersService.revokeInvitation(centerAId, membership!.id)
      ).rejects.toThrow("Cannot revoke - user has already accepted the invitation");
    });

    it("resends invitation", async () => {
      if (!dbAvailable) return;

      const membership = await prisma.centerMembership.findFirst({
        where: { userId: invitedUserId, centerId: centerAId },
      });

      const result = await usersService.resendInvitation(centerAId, membership!.id);

      expect(result.status).toBe("INVITED");
    });

    it("prevents resending invitation to active user", async () => {
      if (!dbAvailable) return;

      const membership = await prisma.centerMembership.findFirst({
        where: { userId: teacherUserId, centerId: centerAId },
      });

      await expect(
        usersService.resendInvitation(centerAId, membership!.id)
      ).rejects.toThrow("User has already accepted the invitation");
    });
  });

  describe("Bulk Operations (AC: 8)", () => {
    it("bulk deactivates multiple users", async () => {
      if (!dbAvailable) return;

      const result = await usersService.bulkDeactivate(
        centerAId,
        { userIds: [teacherUserId, studentUserId] },
        ownerUserId
      );

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);

      // Verify both are suspended
      const memberships = await prisma.centerMembership.findMany({
        where: {
          userId: { in: [teacherUserId, studentUserId] },
          centerId: centerAId,
        },
      });
      expect(memberships.every((m) => m.status === "SUSPENDED")).toBe(true);
    });

    it("skips OWNER in bulk deactivation", async () => {
      if (!dbAvailable) return;

      const result = await usersService.bulkDeactivate(
        centerAId,
        { userIds: [ownerUserId, teacherUserId] },
        teacherUserId
      );

      // Owner should fail, teacher should fail (self), so both fail
      expect(result.failed).toBeGreaterThan(0);
    });

    it("sends bulk reminders", async () => {
      if (!dbAvailable) return;

      const result = await usersService.bulkRemind(centerAId, {
        userIds: [teacherUserId, studentUserId],
      });

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe("Multi-Tenancy Enforcement", () => {
    it("user lists are isolated by center", async () => {
      if (!dbAvailable) return;

      // Add a user to Center B
      await prisma.user.create({
        data: { id: "centerb-user", email: "centerb@test.com", name: "Center B User" },
      });
      await prisma.centerMembership.create({
        data: {
          centerId: centerBId,
          userId: "centerb-user",
          role: CenterRole.TEACHER,
          status: MembershipStatus.ACTIVE,
        },
      });

      const resultA = await usersService.listUsers(centerAId, { page: 1, limit: 10 });
      const resultB = await usersService.listUsers(centerBId, { page: 1, limit: 10 });

      // Center A should not see Center B's user
      expect(resultA.items.find((u) => u.id === "centerb-user")).toBeUndefined();
      // Center B should see their user
      expect(resultB.items.find((u) => u.id === "centerb-user")).toBeDefined();

      // Cleanup
      await prisma.centerMembership.deleteMany({ where: { userId: "centerb-user" } });
      await prisma.user.delete({ where: { id: "centerb-user" } });
    });

    it("operations on users from other centers fail", async () => {
      if (!dbAvailable) return;

      // Try to change role of Center A user from Center B context
      await expect(
        usersService.changeRole(centerBId, teacherUserId, { role: "ADMIN" })
      ).rejects.toThrow("User not found in this center");
    });
  });
});
