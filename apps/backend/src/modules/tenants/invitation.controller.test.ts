import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationController } from "./invitation.controller.js";
import { InvitationService } from "./invitation.service.js";
import { FastifyReply, FastifyRequest } from "fastify";

describe("InvitationController", () => {
  let invitationController: InvitationController;
  let mockInvitationService: any;

  beforeEach(() => {
    mockInvitationService = {
      inviteUser: vi.fn(),
    };
    invitationController = new InvitationController(
      mockInvitationService as InvitationService,
    );
  });

  it("should call invitationService.inviteUser and return data", async () => {
    const input = { email: "test@test.com", role: "TEACHER" as const };
    const user = { centerId: "center-123" } as any;

    mockInvitationService.inviteUser.mockResolvedValue({
      id: "inv-123",
      status: "INVITED",
    });

    const result = await invitationController.inviteUser(input, user);

    expect(mockInvitationService.inviteUser).toHaveBeenCalledWith(
      "center-123",
      input,
    );
    expect(result).toEqual({
      data: { id: "inv-123", status: "INVITED", email: "test@test.com" },
      message: "Invitation sent successfully",
    });
  });

  it("should throw error if user has no centerId", async () => {
    const input = { email: "test@test.com", role: "TEACHER" as const };
    const user = { centerId: null } as any;

    await expect(invitationController.inviteUser(input, user)).rejects.toThrow(
      "User does not belong to a center",
    );
  });
});
