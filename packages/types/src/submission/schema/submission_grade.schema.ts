import { Static, Type } from "@sinclair/typebox";
import { ListeningSubmissionGradeSchema } from './listening_submission_grade.schema.js';
import { ReadingSubmissionGradeSchema } from './reading_submission_grade.schema.js';
import { WritingSubmissionGradeSchema } from './writing_submission_grade.schema.js';

export const SubmissionGradeSchema = Type.Union(
  [
    ReadingSubmissionGradeSchema,
    ListeningSubmissionGradeSchema,
    WritingSubmissionGradeSchema,
  ],
  { $id: "SubmissionGradeSchema" },
);

export type SubmissionGrade = Static<typeof SubmissionGradeSchema>;
