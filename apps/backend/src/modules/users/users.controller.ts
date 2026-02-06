import type {
  UserListQuery,
  UserListResponse,
  UserProfileResponse,
  ChangeRoleRequest,
  ChangeRoleResponse,
  UserStatusResponse,
  BulkUserActionRequest,
  BulkActionResponse,
  InvitationListResponse,
  UpdateProfileInput,
  UpdateProfileResponse,
  ChangePasswordInput,
  ChangePasswordResponse,
  RequestDeletionResponse,
  CancelDeletionResponse,
} from "@workspace/types";
import { AppError } from "../../errors/app-error.js";
import { UsersService } from "./users.service.js";
// Use the custom JwtPayload type from auth middleware for proper type checking
interface JwtPayload {
  uid: string;
  email: string;
  role: string;
  centerId: string | null;
}

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async getUser(
    userId: string,
    user: JwtPayload
  ): Promise<UserProfileResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const profile = await this.usersService.getUserById(centerId, userId);
    if (!profile) {
      throw AppError.notFound("User not found in this center");
    }

    return {
      data: profile,
      message: "User retrieved successfully",
    };
  }

  async listUsers(
    query: UserListQuery,
    user: JwtPayload
  ): Promise<UserListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const { items, total } = await this.usersService.listUsers(centerId, query);
    const hasMore = query.page * query.limit < total;

    return {
      data: {
        items,
        total,
        page: query.page,
        limit: query.limit,
        hasMore,
      },
      message: "Users retrieved successfully",
    };
  }

  async changeRole(
    userId: string,
    input: ChangeRoleRequest,
    user: JwtPayload
  ): Promise<ChangeRoleResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.changeRole(centerId, userId, input);
    return {
      data: result,
      message: "Role changed successfully",
    };
  }

  async deactivateUser(
    userId: string,
    user: JwtPayload
  ): Promise<UserStatusResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.deactivateUser(
      centerId,
      userId,
      user.uid
    );
    return {
      data: result,
      message: "User deactivated successfully",
    };
  }

  async reactivateUser(
    userId: string,
    user: JwtPayload
  ): Promise<UserStatusResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.reactivateUser(centerId, userId);
    return {
      data: result,
      message: "User reactivated successfully",
    };
  }

  async bulkDeactivate(
    input: BulkUserActionRequest,
    user: JwtPayload
  ): Promise<BulkActionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.bulkDeactivate(
      centerId,
      input,
      user.uid
    );
    return {
      data: result,
      message: `Deactivated ${result.processed} users`,
    };
  }

  async bulkRemind(
    input: BulkUserActionRequest,
    user: JwtPayload
  ): Promise<BulkActionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.bulkRemind(centerId, input);
    return {
      data: result,
      message: `Sent reminders to ${result.processed} users`,
    };
  }

  async listInvitations(
    status: string | undefined,
    user: JwtPayload
  ): Promise<InvitationListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const invitations = await this.usersService.listInvitations(
      centerId,
      status
    );
    return {
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role as "OWNER" | "ADMIN" | "TEACHER" | "STUDENT",
        status: inv.status as "INVITED" | "ACTIVE" | "SUSPENDED",
        createdAt: inv.createdAt,
        userId: inv.userId,
      })),
      message: "Invitations retrieved successfully",
    };
  }

  async resendInvitation(
    invitationId: string,
    user: JwtPayload
  ): Promise<{ data: { id: string; status: string }; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.resendInvitation(
      centerId,
      invitationId
    );
    return {
      data: result,
      message: "Invitation resent successfully",
    };
  }

  async revokeInvitation(
    invitationId: string,
    user: JwtPayload
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.usersService.revokeInvitation(centerId, invitationId);
    return {
      message: "Invitation revoked successfully",
    };
  }

  async updateMyProfile(
    input: UpdateProfileInput,
    user: JwtPayload
  ): Promise<UpdateProfileResponse> {
    const profile = await this.usersService.updateProfile(user.uid, input);
    return {
      data: profile,
      message: "Profile updated successfully",
    };
  }

  async changeMyPassword(
    input: ChangePasswordInput,
    user: JwtPayload,
    firebaseApiKey: string
  ): Promise<ChangePasswordResponse> {
    const result = await this.usersService.changePassword(
      user.uid,
      input.currentPassword,
      input.newPassword,
      firebaseApiKey
    );
    return {
      data: result,
      message: "Password updated. Other sessions have been logged out.",
    };
  }

  async hasPasswordProvider(user: JwtPayload): Promise<{ hasPassword: boolean }> {
    const hasPassword = await this.usersService.hasPasswordProvider(user.uid);
    return { hasPassword };
  }

  async requestMyDeletion(user: JwtPayload): Promise<RequestDeletionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.usersService.requestDeletion(centerId, user.uid);
    return {
      data: {
        deletionRequestedAt: result.deletionRequestedAt.toISOString(),
        deletionScheduledFor: result.deletionScheduledFor.toISOString(),
      },
      message: "Your account will be deleted in 7 days. Contact support to cancel.",
    };
  }

  async cancelMyDeletion(user: JwtPayload): Promise<CancelDeletionResponse> {
    const result = await this.usersService.cancelDeletion(user.uid);
    return {
      data: result,
      message: "Account deletion cancelled",
    };
  }
}
