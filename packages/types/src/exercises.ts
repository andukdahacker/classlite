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

// --- Type-Helper Schemas (for editor type safety, not API validation) ---

// Task 1.1: MCQ option structure
export const MCQOptionSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
});
export type MCQOption = z.infer<typeof MCQOptionSchema>;

// R1: MCQ Single options
export const MCQOptionsSchema = z.object({
  items: z.array(MCQOptionSchema).min(2),
});
export type MCQOptions = z.infer<typeof MCQOptionsSchema>;

// R2: MCQ Multi options (extends MCQ with maxSelections)
export const MCQMultiOptionsSchema = z.object({
  items: z.array(MCQOptionSchema).min(2),
  maxSelections: z.number().int().min(1),
});
export type MCQMultiOptions = z.infer<typeof MCQMultiOptionsSchema>;

// R1: MCQ Single answer
export const MCQSingleAnswerSchema = z.object({
  answer: z.string().min(1),
});
export type MCQSingleAnswer = z.infer<typeof MCQSingleAnswerSchema>;

// R2: MCQ Multi answer
export const MCQMultiAnswerSchema = z.object({
  answers: z.array(z.string().min(1)).min(1),
});
export type MCQMultiAnswer = z.infer<typeof MCQMultiAnswerSchema>;

// Task 1.4: TFNG answer (R3)
export const TFNGAnswerSchema = z.object({
  answer: z.enum(["TRUE", "FALSE", "NOT_GIVEN"]),
});
export type TFNGAnswer = z.infer<typeof TFNGAnswerSchema>;

// YNNG answer (R4)
export const YNNGAnswerSchema = z.object({
  answer: z.enum(["YES", "NO", "NOT_GIVEN"]),
});
export type YNNGAnswer = z.infer<typeof YNNGAnswerSchema>;

// Task 1.3: Text answer (R5/R6/R8)
export const TextAnswerSchema = z.object({
  answer: z.string().min(1),
  acceptedVariants: z.array(z.string()),
  caseSensitive: z.boolean(),
});
export type TextAnswer = z.infer<typeof TextAnswerSchema>;

// Task 1.2: Word bank options (R7)
export const WordBankOptionsSchema = z.object({
  wordBank: z.array(z.string()).min(1),
  summaryText: z.string().min(1),
});
export type WordBankOptions = z.infer<typeof WordBankOptionsSchema>;

// Word bank answer (R7)
export const WordBankAnswerSchema = z.object({
  blanks: z.record(z.string(), z.string()),
});
export type WordBankAnswer = z.infer<typeof WordBankAnswerSchema>;

// Matching options (R9-R12) — unified schema for all matching types
export const MatchingOptionsSchema = z.object({
  sourceItems: z.array(z.string()).min(1),
  targetItems: z.array(z.string()).min(1),
});
export type MatchingOptions = z.infer<typeof MatchingOptionsSchema>;

// Matching answer (R9-R12)
export const MatchingAnswerSchema = z.object({
  matches: z.record(z.string(), z.string()),
});
export type MatchingAnswer = z.infer<typeof MatchingAnswerSchema>;

// Task 1.5: Discriminated union — validates options/correctAnswer per question type
export const QuestionOptionsSchema = z.discriminatedUnion("questionType", [
  // R1: MCQ Single
  z.object({
    questionType: z.literal("R1_MCQ_SINGLE"),
    options: MCQOptionsSchema,
    correctAnswer: MCQSingleAnswerSchema,
  }),
  // R2: MCQ Multi
  z.object({
    questionType: z.literal("R2_MCQ_MULTI"),
    options: MCQMultiOptionsSchema,
    correctAnswer: MCQMultiAnswerSchema,
  }),
  // R3: True/False/Not Given
  z.object({
    questionType: z.literal("R3_TFNG"),
    options: z.null(),
    correctAnswer: TFNGAnswerSchema,
  }),
  // R4: Yes/No/Not Given
  z.object({
    questionType: z.literal("R4_YNNG"),
    options: z.null(),
    correctAnswer: YNNGAnswerSchema,
  }),
  // R5: Sentence Completion
  z.object({
    questionType: z.literal("R5_SENTENCE_COMPLETION"),
    options: z.null(),
    correctAnswer: TextAnswerSchema,
  }),
  // R6: Short Answer
  z.object({
    questionType: z.literal("R6_SHORT_ANSWER"),
    options: z.null(),
    correctAnswer: TextAnswerSchema,
  }),
  // R7: Summary Word Bank
  z.object({
    questionType: z.literal("R7_SUMMARY_WORD_BANK"),
    options: WordBankOptionsSchema,
    correctAnswer: WordBankAnswerSchema,
  }),
  // R8: Summary Passage
  z.object({
    questionType: z.literal("R8_SUMMARY_PASSAGE"),
    options: z.null(),
    correctAnswer: TextAnswerSchema,
  }),
  // R9: Matching Headings
  z.object({
    questionType: z.literal("R9_MATCHING_HEADINGS"),
    options: MatchingOptionsSchema,
    correctAnswer: MatchingAnswerSchema,
  }),
  // R10: Matching Information
  z.object({
    questionType: z.literal("R10_MATCHING_INFORMATION"),
    options: MatchingOptionsSchema,
    correctAnswer: MatchingAnswerSchema,
  }),
  // R11: Matching Features
  z.object({
    questionType: z.literal("R11_MATCHING_FEATURES"),
    options: MatchingOptionsSchema,
    correctAnswer: MatchingAnswerSchema,
  }),
  // R12: Matching Sentence Endings
  z.object({
    questionType: z.literal("R12_MATCHING_SENTENCE_ENDINGS"),
    options: MatchingOptionsSchema,
    correctAnswer: MatchingAnswerSchema,
  }),
]);
export type QuestionOptions = z.infer<typeof QuestionOptionsSchema>;

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
