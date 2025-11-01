import { Static, Type } from "@sinclair/typebox";

export const UpdateExerciseInputSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    timeLimit: Type.Optional(Type.Number()),
    content: Type.Any(),
  },
  { $id: "UpdateExerciseInput" },
);

export type UpdateExerciseInput = Static<typeof UpdateExerciseInputSchema>;
