import { Static } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ExerciseSchema } from "../schema/exercise.schema.js";

export const UpdateExerciseResponseSchema = BaseResponseSchema(ExerciseSchema);

export type UpdateExerciseResponse = Static<
  typeof UpdateExerciseResponseSchema
>;
