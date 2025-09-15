import { Static, Type } from "@sinclair/typebox";
import { ExerciseSchema } from "../../exercise/schema/exercise.schema.js";
import { Nullable } from "../../nullable.js";
import { BaseResponseSchema } from "../../response.js";
import { SubmissionSchema } from "../../submission/schema/submission.schema.js";
import { AssignmentSchema } from "../schema/assignment.schema.js";

export const GetAssignmentResponseSchema = BaseResponseSchema(
  Type.Object({
    assignment: AssignmentSchema,
    exercise: ExerciseSchema,
    submission: Nullable(SubmissionSchema),
  }),
);

export type GetAssignmentResponse = Static<typeof GetAssignmentResponseSchema>;
