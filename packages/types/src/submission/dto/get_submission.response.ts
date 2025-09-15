import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { SubmissionSchema } from "../schema/submission.schema.js";
import { ExerciseSchema } from "../../exercise/schema/exercise.schema.js";
import { AssignmentSchema } from "../../assignment/schema/assignment.schema.js";

export const GetSubmissionResponseSchema = BaseResponseSchema(
  Type.Object({
    submission: SubmissionSchema,
    exercise: ExerciseSchema,
    assignment: AssignmentSchema,
  }),
);

export type GetSubmissionResponse = Static<typeof GetSubmissionResponseSchema>;
