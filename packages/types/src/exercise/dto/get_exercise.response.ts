import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ExerciseSchema } from "../schema/exercise.schema.js";

export const GetExerciseResponseSchema = BaseResponseSchema(
  Type.Object({
    exercise: ExerciseSchema,
  }),
);

export type GetExerciseResponse = Static<typeof GetExerciseResponseSchema>;
