import { z } from "zod";
import { createResponseSchema } from "./response.js";

export const CreateInvitationRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  personalMessage: z.string().max(500).optional(),
});

export type CreateInvitationRequest = z.infer<
  typeof CreateInvitationRequestSchema
>;

export const InvitationResponseSchema = createResponseSchema(z
  .object({
    id: z.string(),
    email: z.email(),
    role: z.string(),
    centerId: z.string(),
    status: z.string(),
  }))


export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;
