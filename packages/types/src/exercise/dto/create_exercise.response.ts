import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ExerciseSchema } from "../schema/exercise.schema.js";

export const CreateExerciseResponseSchema = BaseResponseSchema(
  Type.Object({
    exercise: ExerciseSchema,
  }),
  {
    $id: "CreateExerciseResponseSchema",
  },
);

export type CreateExerciseResponse = Static<
  typeof CreateExerciseResponseSchema
>;
