import { Static, Type } from "@sinclair/typebox";
import { ClassSchema } from "../../class/schema/class.schema.js";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../../user/schema/user.schema.js";
import { AssignmentSchema } from "../schema/assignment.schema.js";

export const GetAssignmentsByExerciseResponseSchema = BaseResponseSchema(
  Type.Object({
    assignments: Type.Array(
      Type.Object({
        assignment: AssignmentSchema,
        user: UserSchema,
        class: ClassSchema,
      }),
    ),
  }),
  { $id: "GetAssignmentsByExerciseResponse" },
);

export type GetAssignmentsByExerciseResponse = Static<
  typeof GetAssignmentsByExerciseResponseSchema
>;
