import { Static, Type } from "@sinclair/typebox";
import { ListeningSubmissionContentSchema } from "./listening_submission_content.schema.js";
import { ReadingSubmissionContentSchema } from "./reading_submission_content.schema.js";
import { WritingSubmissionContentSchema } from "./writing_submission_content.schema.js";

export const SubmissionContentSchema = Type.Union(
  [
    WritingSubmissionContentSchema,
    ReadingSubmissionContentSchema,
    ListeningSubmissionContentSchema,
  ],
  { $id: "SubmissionContent" },
);

export type SubmissionContentSchema = Static<typeof SubmissionContentSchema>;
