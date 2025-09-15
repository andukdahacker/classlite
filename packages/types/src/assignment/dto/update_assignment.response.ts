import { Static } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { AssignmentSchema } from "../schema/assignment.schema.js";

export const UpdateAssignmentsResponseSchema =
  BaseResponseSchema(AssignmentSchema);

export type UpdateAssignmentsResponse = Static<
  typeof UpdateAssignmentsResponseSchema
>;
