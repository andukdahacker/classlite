import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { AssignmentSchema } from "../schema/assignment.schema.js";

export const CreateAssignmentsResponseSchema = BaseResponseSchema(
  Type.Object({
    assignments: Type.Array(AssignmentSchema),
  }),
  { $id: "CreateAssignmentsResponse" },
);

export type CreateAssignmentResponse = Static<
  typeof CreateAssignmentsResponseSchema
>;
