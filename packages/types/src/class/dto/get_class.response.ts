import { Static, Type } from "@sinclair/typebox";
import { AssignmentSchema } from "../../assignment/schema/assignment.schema.js";
import { ExerciseSchema } from "../../exercise/schema/exercise.schema.js";
import { Nullable } from "../../nullable.js";
import { BaseResponseSchema } from "../../response.js";
import { SubmissionSchema } from "../../submission/schema/submission.schema.js";
import { UserSchema } from "../../user/schema/user.schema.js";
import { ClassSchema } from "../schema/class.schema.js";

export const GetClassResponseSchema = BaseResponseSchema(
  Type.Object({
    class: ClassSchema,
    classMembers: Type.Array(
      Type.Object({
        user: UserSchema,
        assignments: Type.Array(
          Type.Object({
            assignment: AssignmentSchema,
            submission: Nullable(SubmissionSchema),
            exercise: ExerciseSchema,
          }),
        ),
      }),
    ),
  }),
);

export type GetClassResponse = Static<typeof GetClassResponseSchema>;
