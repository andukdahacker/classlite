import { z } from "zod";
import { createResponseSchema } from "./response.js";
import {
  MCQSingleAnswerSchema,
  MCQMultiAnswerSchema,
  TFNGAnswerSchema,
  YNNGAnswerSchema,
  MatchingAnswerSchema,
  WordBankAnswerSchema,
} from "./exercises.js";

// --- Enums ---

export const SubmissionStatusSchema = z.enum([
  "IN_PROGRESS",
  "SUBMITTED",
  "GRADED",
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

// --- Student Answer Schemas (simpler than teacher answer schemas) ---

// Reuse directly from exercises.ts (identical structure)
export { MCQSingleAnswerSchema, MCQMultiAnswerSchema, TFNGAnswerSchema, YNNGAnswerSchema };
export { MatchingAnswerSchema as StudentMatchingAnswerSchema };
export { WordBankAnswerSchema as StudentWordBankAnswerSchema };

// Simplified text answer (no acceptedVariants, no strictWordOrder)
export const StudentTextAnswerSchema = z.object({
  answer: z.string(),
});
export type StudentTextAnswer = z.infer<typeof StudentTextAnswerSchema>;

// Simplified note/table/flowchart answer (just blank strings, no per-blank variants)
export const StudentNoteTableFlowchartAnswerSchema = z.object({
  blanks: z.record(z.string(), z.string()),
});
export type StudentNoteTableFlowchartAnswer = z.infer<typeof StudentNoteTableFlowchartAnswerSchema>;

// Simplified diagram labelling answer (just label strings)
export const StudentDiagramLabellingAnswerSchema = z.object({
  labels: z.record(z.string(), z.string()),
});
export type StudentDiagramLabellingAnswer = z.infer<typeof StudentDiagramLabellingAnswerSchema>;

// Writing answer (typed text or photo)
export const StudentWritingAnswerSchema = z.object({
  text: z.string().optional(),
  photoUrl: z.string().optional(),
});
export type StudentWritingAnswer = z.infer<typeof StudentWritingAnswerSchema>;

// Speaking answer (audio recording)
export const StudentSpeakingAnswerSchema = z.object({
  audioUrl: z.string(),
  duration: z.number().optional(),
});
export type StudentSpeakingAnswer = z.infer<typeof StudentSpeakingAnswerSchema>;

// --- API Request Schemas ---

export const StartSubmissionSchema = z.object({
  assignmentId: z.string().min(1),
});
export type StartSubmissionInput = z.infer<typeof StartSubmissionSchema>;

export const StudentAnswerInputSchema = z.object({
  questionId: z.string().min(1),
  answer: z.unknown().optional(),
});

export const SaveAnswersRequestSchema = z.object({
  answers: z.array(StudentAnswerInputSchema).min(1),
});
export type SaveAnswersInput = z.infer<typeof SaveAnswersRequestSchema>;

export const SubmitSubmissionSchema = z.object({
  timeSpentSec: z.number().int().min(0).optional(),
});
export type SubmitSubmissionInput = z.infer<typeof SubmitSubmissionSchema>;

// --- Response Schemas ---

export const StudentAnswerSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  questionId: z.string(),
  centerId: z.string(),
  answer: z.unknown().nullable(),
  photoUrl: z.string().nullable(),
  isCorrect: z.boolean().nullable(),
  score: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StudentAnswer = z.infer<typeof StudentAnswerSchema>;

export const SubmissionSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  assignmentId: z.string(),
  studentId: z.string(),
  status: SubmissionStatusSchema,
  startedAt: z.string(),
  submittedAt: z.string().nullable(),
  timeSpentSec: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  answers: z.array(StudentAnswerSchema).optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const SubmissionResponseSchema = createResponseSchema(SubmissionSchema);
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;

export const SubmissionListResponseSchema = createResponseSchema(
  z.array(SubmissionSchema),
);
export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;
