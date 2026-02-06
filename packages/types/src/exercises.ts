import { z } from "zod";
import { createResponseSchema } from "./response.js";

// --- Enums ---

export const ExerciseSkillSchema = z.enum([
  "READING",
  "LISTENING",
  "WRITING",
  "SPEAKING",
]);
export type ExerciseSkill = z.infer<typeof ExerciseSkillSchema>;

export const ExerciseStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);
export type ExerciseStatus = z.infer<typeof ExerciseStatusSchema>;

export const IeltsQuestionTypeSchema = z.enum([
  // Reading
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
  // Listening
  "L1_FORM_NOTE_TABLE",
  "L2_MCQ",
  "L3_MATCHING",
  "L4_MAP_PLAN_LABELLING",
  "L5_SENTENCE_COMPLETION",
  "L6_SHORT_ANSWER",
  // Writing
  "W1_TASK1_ACADEMIC",
  "W2_TASK1_GENERAL",
  "W3_TASK2_ESSAY",
  // Speaking
  "S1_PART1_QA",
  "S2_PART2_CUE_CARD",
  "S3_PART3_DISCUSSION",
]);
export type IeltsQuestionType = z.infer<typeof IeltsQuestionTypeSchema>;

// --- Question ---

export const QuestionSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  centerId: z.string(),
  questionText: z.string(),
  questionType: z.string(),
  options: z.unknown().nullable().optional(),
  correctAnswer: z.unknown().nullable().optional(),
  orderIndex: z.number(),
  wordLimit: z.number().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});
export type Question = z.infer<typeof QuestionSchema>;

export const CreateQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.string().min(1, "Question type is required"),
  options: z.unknown().nullable().optional(),
  correctAnswer: z.unknown().nullable().optional(),
  orderIndex: z.number().int().min(0),
  wordLimit: z.number().int().positive().nullable().optional(),
});
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = CreateQuestionSchema.partial();
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

// --- Question Section ---

export const QuestionSectionSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  centerId: z.string(),
  sectionType: IeltsQuestionTypeSchema,
  instructions: z.string().nullable().optional(),
  orderIndex: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  questions: z.array(QuestionSchema).optional(),
});
export type QuestionSection = z.infer<typeof QuestionSectionSchema>;

export const CreateQuestionSectionSchema = z.object({
  sectionType: IeltsQuestionTypeSchema,
  instructions: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0),
});
export type CreateQuestionSectionInput = z.infer<
  typeof CreateQuestionSectionSchema
>;

export const UpdateQuestionSectionSchema = CreateQuestionSectionSchema.partial();
export type UpdateQuestionSectionInput = z.infer<
  typeof UpdateQuestionSectionSchema
>;

// --- Exercise ---

export const ExerciseSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  title: z.string(),
  instructions: z.string().nullable().optional(),
  skill: ExerciseSkillSchema,
  status: ExerciseStatusSchema,
  passageContent: z.string().nullable().optional(),
  passageFormat: z.string().nullable().optional(),
  createdById: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  sections: z.array(QuestionSectionSchema).optional(),
  createdBy: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
    })
    .optional(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const CreateExerciseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  instructions: z.string().nullable().optional(),
  skill: ExerciseSkillSchema,
  passageContent: z.string().nullable().optional(),
  passageFormat: z.string().nullable().optional(),
});
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

export const UpdateExerciseSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  instructions: z.string().nullable().optional(),
  passageContent: z.string().nullable().optional(),
  passageFormat: z.string().nullable().optional(),
});
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseSchema>;

export const AutosaveExerciseSchema = z.object({
  title: z.string().optional(),
  instructions: z.string().nullable().optional(),
  passageContent: z.string().nullable().optional(),
  passageFormat: z.string().nullable().optional(),
});
export type AutosaveExerciseInput = z.infer<typeof AutosaveExerciseSchema>;

// --- Response Schemas ---

export const ExerciseResponseSchema = createResponseSchema(ExerciseSchema);
export type ExerciseResponse = z.infer<typeof ExerciseResponseSchema>;

export const ExerciseListResponseSchema = createResponseSchema(
  z.array(ExerciseSchema),
);
export type ExerciseListResponse = z.infer<typeof ExerciseListResponseSchema>;

export const QuestionSectionResponseSchema =
  createResponseSchema(QuestionSectionSchema);
export type QuestionSectionResponse = z.infer<
  typeof QuestionSectionResponseSchema
>;

export const QuestionSectionListResponseSchema = createResponseSchema(
  z.array(QuestionSectionSchema),
);
export type QuestionSectionListResponse = z.infer<
  typeof QuestionSectionListResponseSchema
>;

export const QuestionResponseSchema = createResponseSchema(QuestionSchema);
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const QuestionListResponseSchema = createResponseSchema(
  z.array(QuestionSchema),
);
export type QuestionListResponse = z.infer<typeof QuestionListResponseSchema>;
