import { Static, Type } from "@sinclair/typebox";
import { Nullable } from "../../nullable.js";

export const WritingExerciseTypeSchema = Type.Union(
  [Type.Literal("Task 1"), Type.Literal("Task 2")],
  { $id: "WritingExerciseType" },
);

export type WritingExerciseType = Static<typeof WritingExerciseTypeSchema>;

export const WritingExerciseSchema = Type.Object(
  {
    file: Nullable(
      Type.Object({
        url: Type.String(),
        key: Type.String(),
        fileName: Type.String(),
      }),
    ),
    type: WritingExerciseTypeSchema,
    title: Type.Any(),
    duration: Nullable(Type.Number()),
  },
  { $id: "WritingExercise" },
);

export type WritingExercise = Static<typeof WritingExerciseSchema>;
