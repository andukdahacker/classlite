import { Static, Type } from "@sinclair/typebox";
import { AssignmentStatusSchema } from "../schema/assignment.schema.js";

export const UpdateAssignmentInputSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  dueDate: Type.Optional(Type.Any()),
  status: Type.Optional(AssignmentStatusSchema),
});

export type UpdateAssignmentInput = Static<typeof UpdateAssignmentInputSchema>;
