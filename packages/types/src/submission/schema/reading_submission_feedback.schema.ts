import { Static, Type } from "@sinclair/typebox";

export const ReadingSubmissionFeedbackSchema = Type.Object(
  {
    feedback: Type.Any(),
  },
  {
    $id: "ReadingSubmissionFeedback",
  },
);

export type ReadingSubmissionFeedback = Static<
  typeof ReadingSubmissionFeedbackSchema
>;
