import { z } from "zod";
import { createResponseSchema } from "./response.js";

// --- Enums ---

export const GradingJobStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type GradingJobStatus = z.infer<typeof GradingJobStatusSchema>;

export const ErrorCategorySchema = z.enum([
  "api_timeout",
  "rate_limit",
  "invalid_response",
  "validation_error",
  "other",
]);
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

export const AnalysisStatusSchema = z.enum([
  "not_applicable",
  "analyzing",
  "ready",
  "failed",
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const FeedbackItemTypeSchema = z.enum([
  "grammar",
  "vocabulary",
  "coherence",
  "score_suggestion",
  "general",
]);
export type FeedbackItemType = z.infer<typeof FeedbackItemTypeSchema>;

export const FeedbackSeveritySchema = z.enum([
  "error",
  "warning",
  "suggestion",
]);
export type FeedbackSeverity = z.infer<typeof FeedbackSeveritySchema>;

// --- GradingJob ---

export const GradingJobSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  submissionId: z.string(),
  status: GradingJobStatusSchema,
  error: z.string().nullable().optional(),
  errorCategory: ErrorCategorySchema.nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});
export type GradingJob = z.infer<typeof GradingJobSchema>;

// --- AIFeedbackItem ---

export const AIFeedbackItemSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  submissionFeedbackId: z.string(),
  questionId: z.string().nullable().optional(),
  type: FeedbackItemTypeSchema,
  content: z.string(),
  startOffset: z.number().int().nullable().optional(),
  endOffset: z.number().int().nullable().optional(),
  originalContextSnippet: z.string().nullable().optional(),
  suggestedFix: z.string().nullable().optional(),
  severity: FeedbackSeveritySchema.nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  isApproved: z.boolean().nullable().optional(),
  approvedAt: z.union([z.date(), z.string()]).nullable().optional(),
  teacherOverrideText: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
});
export type AIFeedbackItem = z.infer<typeof AIFeedbackItemSchema>;

// --- SubmissionFeedback ---

export const CriteriaScoresSchema = z.object({
  taskAchievement: z.number().min(0).max(9).optional(),
  coherence: z.number().min(0).max(9).optional(),
  lexicalResource: z.number().min(0).max(9).optional(),
  grammaticalRange: z.number().min(0).max(9).optional(),
  fluency: z.number().min(0).max(9).optional(),
  pronunciation: z.number().min(0).max(9).optional(),
});
export type CriteriaScores = z.infer<typeof CriteriaScoresSchema>;

export const SubmissionFeedbackSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  submissionId: z.string(),
  overallScore: z.number().min(0).max(9).nullable().optional(),
  criteriaScores: CriteriaScoresSchema.nullable().optional(),
  generalFeedback: z.string().nullable().optional(),
  teacherFinalScore: z.number().min(0).max(9).nullable().optional(),
  teacherCriteriaScores: CriteriaScoresSchema.nullable().optional(),
  teacherGeneralFeedback: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  items: z.array(AIFeedbackItemSchema).optional(),
});
export type SubmissionFeedback = z.infer<typeof SubmissionFeedbackSchema>;

// --- AI Response Schema (for Gemini structured output) ---

export const AIHighlightSchema = z.object({
  type: FeedbackItemTypeSchema,
  startOffset: z.number().int(),
  endOffset: z.number().int(),
  content: z.string(),
  suggestedFix: z.string().optional(),
  severity: FeedbackSeveritySchema,
  confidence: z.number().min(0).max(1),
  originalContextSnippet: z.string(),
});
export type AIHighlight = z.infer<typeof AIHighlightSchema>;

export const AIGradingResponseSchema = z.object({
  overallScore: z.number().min(0).max(9),
  criteriaScores: CriteriaScoresSchema,
  generalFeedback: z.string(),
  highlights: z.array(AIHighlightSchema),
});
export type AIGradingResponse = z.infer<typeof AIGradingResponseSchema>;

// --- API Request Schemas ---

export const GradingQueueFiltersSchema = z.object({
  classId: z.string().optional(),
  assignmentId: z.string().optional(),
  status: AnalysisStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type GradingQueueFilters = z.infer<typeof GradingQueueFiltersSchema>;

export const TriggerAnalysisRequestSchema = z.object({
  submissionId: z.string().min(1),
});
export type TriggerAnalysisRequest = z.infer<typeof TriggerAnalysisRequestSchema>;

// --- API Response Schemas ---

export const GradingQueueItemSchema = z.object({
  submissionId: z.string(),
  studentName: z.string().nullable(),
  assignmentTitle: z.string().nullable(),
  exerciseSkill: z.string(),
  submittedAt: z.string().nullable(),
  analysisStatus: AnalysisStatusSchema,
  failureReason: z.string().nullable().optional(),
});
export type GradingQueueItem = z.infer<typeof GradingQueueItemSchema>;

export const GradingQueueResponseSchema = createResponseSchema(
  z.object({
    items: z.array(GradingQueueItemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
);
export type GradingQueueResponse = z.infer<typeof GradingQueueResponseSchema>;

export const SubmissionDetailSchema = z.object({
  submission: z.object({
    id: z.string(),
    centerId: z.string(),
    assignmentId: z.string(),
    studentId: z.string(),
    status: z.string(),
    submittedAt: z.string().nullable(),
    answers: z.array(z.unknown()),
  }),
  analysisStatus: AnalysisStatusSchema,
  feedback: SubmissionFeedbackSchema.nullable().optional(),
});
export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;

export const SubmissionDetailResponseSchema = createResponseSchema(SubmissionDetailSchema);
export type SubmissionDetailResponse = z.infer<typeof SubmissionDetailResponseSchema>;

export const SubmissionFeedbackResponseSchema = createResponseSchema(SubmissionFeedbackSchema);
export type SubmissionFeedbackResponse = z.infer<typeof SubmissionFeedbackResponseSchema>;

export const GradingJobResponseSchema = createResponseSchema(GradingJobSchema);
export type GradingJobResponse = z.infer<typeof GradingJobResponseSchema>;
