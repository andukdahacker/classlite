import { z } from "zod";
import { createResponseSchema } from "./response.js";

// Only reading types allowed for AI generation
export const AIGenerableQuestionTypeSchema = z.enum([
  "R1_MCQ_SINGLE",
  "R2_MCQ_MULTI",
  "R3_TFNG",
  "R4_YNNG",
  "R5_SENTENCE_COMPLETION",
  "R6_SHORT_ANSWER",
  "R7_SUMMARY_WORD_BANK",
  "R8_SUMMARY_PASSAGE",
  "R9_MATCHING_HEADINGS",
  "R10_MATCHING_INFORMATION",
  "R11_MATCHING_FEATURES",
  "R12_MATCHING_SENTENCE_ENDINGS",
  "R13_NOTE_TABLE_FLOWCHART",
  "R14_DIAGRAM_LABELLING",
]);
export type AIGenerableQuestionType = z.infer<
  typeof AIGenerableQuestionTypeSchema
>;

export const DifficultyLevelSchema = z.enum(["easy", "medium", "hard"]);
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

export const QuestionTypeRequestSchema = z.object({
  type: AIGenerableQuestionTypeSchema,
  count: z.number().int().min(1).max(20),
});
export type QuestionTypeRequest = z.infer<typeof QuestionTypeRequestSchema>;

export const GenerateQuestionsRequestSchema = z.object({
  questionTypes: z.array(QuestionTypeRequestSchema).min(1).max(10),
  difficulty: DifficultyLevelSchema.optional().default("medium"),
});
export type GenerateQuestionsRequest = z.infer<
  typeof GenerateQuestionsRequestSchema
>;

export const RegenerateQuestionsSectionRequestSchema = z.object({
  sectionId: z.string(),
  difficulty: DifficultyLevelSchema.optional(),
});
export type RegenerateQuestionsSectionRequest = z.infer<
  typeof RegenerateQuestionsSectionRequestSchema
>;

export const AIGenerationJobStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type AIGenerationJobStatus = z.infer<
  typeof AIGenerationJobStatusSchema
>;

export const AIGenerationJobSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  exerciseId: z.string(),
  status: AIGenerationJobStatusSchema,
  questionTypes: z.array(QuestionTypeRequestSchema),
  difficulty: DifficultyLevelSchema.nullable().optional(),
  error: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});
export type AIGenerationJob = z.infer<typeof AIGenerationJobSchema>;

export const AIGenerationJobResponseSchema = createResponseSchema(
  AIGenerationJobSchema,
);
export const AIGenerationJobListResponseSchema = createResponseSchema(
  z.array(AIGenerationJobSchema),
);
