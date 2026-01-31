import {
  PrismaClient,
  getTenantedClient,
  CenterRole,
  MembershipStatus,
} from "@workspace/db";
import type {
  UserListQuery,
  UserListItem,
  UserProfile,
  ChangeRoleRequest,
  BulkUserActionRequest,
} from "@workspace/types";
import { getAuth } from "firebase-admin/auth";

export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserById(centerId: string, userId: string): Promise<UserProfile | null> {
    const db = getTenantedClient(this.prisma, centerId);

    const membership = await db.centerMembership.findFirst({
      where: { userId },
      include: { user: true },
    });

    if (!membership) {
      return null;
    }

    return {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      avatarUrl: membership.user.avatarUrl,
      role: membership.role as "OWNER" | "ADMIN" | "TEACHER" | "STUDENT",
      status: membership.status as "ACTIVE" | "SUSPENDED" | "INVITED",
      createdAt: membership.createdAt.toISOString(),
      lastActiveAt: membership.user.updatedAt?.toISOString() ?? null,
    };
  }

  async listUsers(
    centerId: string,
    query: UserListQuery
  ): Promise<{ items: UserListItem[]; total: number }> {
    const db = getTenantedClient(this.prisma, centerId);
    const { page, limit, search, role, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [memberships, total] = await Promise.all([
      db.centerMembership.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.centerMembership.count({ where }),
    ]);

    const items: UserListItem[] = memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role as "OWNER" | "ADMIN" | "TEACHER" | "STUDENT",
      status: m.status as "ACTIVE" | "SUSPENDED" | "INVITED",
      membershipId: m.id,
      createdAt: m.createdAt.toISOString(),
      lastActiveAt: m.user.updatedAt?.toISOString() ?? null,
    }));

    return { items, total };
  }

  async changeRole(
    centerId: string,
    userId: string,
    input: ChangeRoleRequest
  ): Promise<{ id: string; role: string }> {
    const db = getTenantedClient(this.prisma, centerId);

    const membership = await db.centerMembership.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new Error("User not found in this center");
    }

    // Cannot change role of an OWNER
    if (membership.role === "OWNER") {
      throw new Error("Cannot change role of an owner");
    }

    const updated = await db.centerMembership.update({
      where: { id: membership.id },
      data: { role: input.role as CenterRole },
    });

    return { id: userId, role: updated.role };
  }

  async deactivateUser(
    centerId: string,
    userId: string,
    requestingUserId: string
  ): Promise<{ id: string; status: string }> {
    const db = getTenantedClient(this.prisma, centerId);

    // Cannot deactivate yourself
    if (userId === requestingUserId) {
      throw new Error("Cannot deactivate yourself");
    }

    const membership = await db.centerMembership.findFirst({
      where: { userId },
      include: { user: true },
    });

    if (!membership) {
      throw new Error("User not found in this center");
    }

    // Cannot deactivate the last active OWNER
    if (membership.role === "OWNER") {
      const activeOwnerCount = await db.centerMembership.count({
        where: {
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      if (activeOwnerCount <= 1) {
        throw new Error("Cannot deactivate the last owner");
      }
    }

    // Update status to SUSPENDED
    const updated = await db.centerMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.SUSPENDED },
    });

    // Revoke Firebase sessions if user has auth account
    const authAccount = await this.prisma.authAccount.findFirst({
      where: { userId, provider: "FIREBASE" },
    });

    if (authAccount) {
      try {
        await getAuth().revokeRefreshTokens(authAccount.providerUserId);
      } catch {
        // Log but don't fail if Firebase revocation fails
      }
    }

    return { id: userId, status: updated.status };
  }

  async reactivateUser(
    centerId: string,
    userId: string
  ): Promise<{ id: string; status: string }> {
    const db = getTenantedClient(this.prisma, centerId);

    const membership = await db.centerMembership.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new Error("User not found in this center");
    }

    const updated = await db.centerMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.ACTIVE },
    });

    return { id: userId, status: updated.status };
  }

  async bulkDeactivate(
    centerId: string,
    input: BulkUserActionRequest,
    requestingUserId: string
  ): Promise<{ processed: number; failed: number }> {
    const db = getTenantedClient(this.prisma, centerId);
    let processed = 0;
    let failed = 0;

    for (const userId of input.userIds) {
      try {
        // Skip self
        if (userId === requestingUserId) {
          failed++;
          continue;
        }

        const membership = await db.centerMembership.findFirst({
          where: { userId },
        });

        // Skip owners
        if (!membership || membership.role === "OWNER") {
          failed++;
          continue;
        }

        await db.centerMembership.update({
          where: { id: membership.id },
          data: { status: MembershipStatus.SUSPENDED },
        });

        // Revoke Firebase sessions
        const authAccount = await this.prisma.authAccount.findFirst({
          where: { userId, provider: "FIREBASE" },
        });

        if (authAccount) {
          try {
            await getAuth().revokeRefreshTokens(authAccount.providerUserId);
          } catch {
            // Continue even if revocation fails
          }
        }

        processed++;
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  }

  async bulkRemind(
    centerId: string,
    input: BulkUserActionRequest
  ): Promise<{ processed: number; failed: number }> {
    // This would integrate with email service
    // For now, just count the users
    return { processed: input.userIds.length, failed: 0 };
  }

  async listInvitations(
    centerId: string,
    status?: string
  ): Promise<
    Array<{
      id: string;
      email: string | null;
      role: string;
      status: string;
      createdAt: string;
      userId: string;
    }>
  > {
    const db = getTenantedClient(this.prisma, centerId);

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    const memberships = await db.centerMembership.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return memberships.map((m) => ({
      id: m.id,
      email: m.user.email,
      role: m.role,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      userId: m.userId,
    }));
  }

  async resendInvitation(
    centerId: string,
    invitationId: string
  ): Promise<{ id: string; status: string }> {
    const db = getTenantedClient(this.prisma, centerId);

    const membership = await db.centerMembership.findUnique({
      where: { id: invitationId },
      include: { user: true },
    });

    if (!membership) {
      throw new Error("Invitation not found");
    }

    if (membership.status !== "INVITED") {
      throw new Error("User has already accepted the invitation");
    }

    // Would trigger email resend here
    // For now, just return the invitation

    return { id: invitationId, status: membership.status };
  }

  async revokeInvitation(centerId: string, invitationId: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    const membership = await db.centerMembership.findUnique({
      where: { id: invitationId },
    });

    if (!membership) {
      throw new Error("Invitation not found");
    }

    if (membership.status !== "INVITED") {
      throw new Error("Cannot revoke - user has already accepted the invitation");
    }

    // Delete the membership (invitation)
    await db.centerMembership.delete({
      where: { id: invitationId },
    });
  }
}
