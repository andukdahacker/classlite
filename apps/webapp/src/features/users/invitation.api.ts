import { client } from "@/core/client";
import type { CreateInvitationRequest } from "@workspace/types";

export async function createInvitation(input: CreateInvitationRequest) {
  const result = await client.POST("/api/v1/invitations/", {
    body: input,
  });

  if (result.error) {
    throw new Error(
      result.error.message || "Failed to send invitation",
    );
  }

  return result.data.data;
}
