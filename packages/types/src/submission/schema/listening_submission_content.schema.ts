import { Static, Type } from "@sinclair/typebox";
import { Nullable } from '../../nullable.js';

export const ListeningSubmissionContentSchema = Type.Object(
  {
    tasks: Type.Array(
      Type.Object({
        order: Type.Number(),
        questions: Type.Array(
          Type.Object({
            order: Type.Number(),
            answer: Nullable(Type.String()),
          }),
        ),
      }),
    ),
  },
  { $id: "ListeningSubmissionContent" },
);

export type ListeningSubmissionContent = Static<
  typeof ListeningSubmissionContentSchema
>;
