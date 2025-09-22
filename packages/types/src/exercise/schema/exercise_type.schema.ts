import { Static, Type } from "@sinclair/typebox";

export const ExerciseTypeSchema = Type.Union(
  [
    Type.Literal("READING"),
    Type.Literal("LISTENING"),
    Type.Literal("WRITING"),
    Type.Literal("SPEAKING"),
  ],
  { $id: "ExerciseType" },
);

export type ExerciseType = Static<typeof ExerciseTypeSchema>;
