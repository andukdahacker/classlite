import { Static, Type } from "@sinclair/typebox";
import { ListeningSubmissionFeedbackSchema } from "./listening_submission_feedback.schema.js";
import { ReadingSubmissionFeedbackSchema } from "./reading_submission_feedback.schema.js";
import { WritingSubmissionFeedbackSchema } from "./writing_submission_feedback.schema.js";

export const SubmissionFeedbackSchema = Type.Union(
  [
    WritingSubmissionFeedbackSchema,
    ReadingSubmissionFeedbackSchema,
    ListeningSubmissionFeedbackSchema,
  ],
  {
    $id: "SubmissionFeedback",
  },
);

export type SubmissionFeedback = Static<typeof SubmissionFeedbackSchema>;
