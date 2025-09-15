import { Static } from "@sinclair/typebox";
import { PaginatedBaseReponseSchema } from "../../response.js";
import { ExerciseSchema } from "../schema/exercise.schema.js";

export const GetExerciseListResponseSchema =
  PaginatedBaseReponseSchema(ExerciseSchema);

export type GetExerciseListResponse = Static<
  typeof GetExerciseListResponseSchema
>;
