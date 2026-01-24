import { CreateInvitationRequest, InvitationResponse } from "@workspace/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { InvitationService } from "./invitation.service.js";
import { JwtPayload } from "jsonwebtoken";

export class InvitationController {
  constructor(private readonly invitationService: InvitationService) { }

  async inviteUser(
    input: CreateInvitationRequest,
    user: JwtPayload
  ): Promise<InvitationResponse> {
    if (!user.centerId) {
      throw new Error("User does not belong to a center");
    }

    try {
      const result = await this.invitationService.inviteUser(
        user.centerId,
        input,
      );

      return {
        data: {
          ...result,
          email: input.email
        },
        message: "Invitation sent successfully",
      };
    } catch (error: any) {
      if (error.message === "User is already a member of this center") {
        throw new Error(error.message);
      }
      throw error;
    }
  }
}
