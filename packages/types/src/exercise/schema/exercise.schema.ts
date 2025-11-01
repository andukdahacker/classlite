import { Static, Type } from "@sinclair/typebox";
import { Nullable } from "../../nullable.js";
import { ExerciseTypeSchema } from "./exercise_type.schema.js";

export const ExerciseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    type: ExerciseTypeSchema,
    content: Type.Any(),
    centerId: Nullable(Type.String()),
    duration: Type.Optional(Type.Number()),
    createdAt: Type.Any(),
    updatedAt: Type.Any(),
  },
  { $id: "Exercise" },
);

export type Exercise = Static<typeof ExerciseSchema>;
