import { Static, Type } from "@sinclair/typebox";
import { AssignmentSchema } from "../../assignment/schema/assignment.schema.js";
import { ExerciseSchema } from "../../exercise/schema/exercise.schema.js";
import { BaseResponseSchema } from "../../response.js";
import { SubmissionSchema } from "../schema/submission.schema.js";

export const UpdateSubmissionResponseSchema = BaseResponseSchema(
  Type.Object({
    submission: SubmissionSchema,
    exercise: ExerciseSchema,
    assignment: AssignmentSchema,
  }),
);

export type UpdateSubmissionResponse = Static<
  typeof UpdateSubmissionResponseSchema
>;
