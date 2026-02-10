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

export const PlaybackModeSchema = z.enum(["TEST_MODE", "PRACTICE_MODE"]);
export type PlaybackMode = z.infer<typeof PlaybackModeSchema>;

export const LetterToneSchema = z.enum(["formal", "informal", "semi-formal"]);
export type LetterTone = z.infer<typeof LetterToneSchema>;

export const WordCountModeSchema = z.enum(["soft", "hard"]);
export type WordCountMode = z.infer<typeof WordCountModeSchema>;

export const BandLevelSchema = z.enum(["4-5", "5-6", "6-7", "7-8", "8-9"]);
export type BandLevel = z.infer<typeof BandLevelSchema>;

export const AudioSectionSchema = z
  .object({
    label: z.string().min(1),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
  })
  .refine((s) => s.endTime > s.startTime, {
    message: "endTime must be greater than startTime",
  });
export type AudioSection = z.infer<typeof AudioSectionSchema>;

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

// Text answer (R5/R6/R8) — Story 3.5: caseSensitive removed (now exercise-level), strictWordOrder added
export const TextAnswerSchema = z.object({
  answer: z.string().min(1),
  acceptedVariants: z.array(z.string()).default([]),
  strictWordOrder: z.boolean().default(true),
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

// Note/Table/Flowchart Completion options (R13)
export const NoteTableFlowchartOptionsSchema = z.object({
  subFormat: z.enum(["note", "table", "flowchart"]),
  structure: z.string().min(1),
  wordLimit: z.number().int().min(1).max(5).default(2),
});
export type NoteTableFlowchartOptions = z.infer<typeof NoteTableFlowchartOptionsSchema>;

// Note/Table/Flowchart Completion answer (R13) — Story 3.5: variant-aware structured format
export const NoteTableFlowchartBlankSchema = z.object({
  answer: z.string(),
  acceptedVariants: z.array(z.string()).default([]),
  strictWordOrder: z.boolean().default(true),
});
export type NoteTableFlowchartBlank = z.infer<typeof NoteTableFlowchartBlankSchema>;

export const NoteTableFlowchartAnswerSchema = z.object({
  blanks: z.record(z.string(), NoteTableFlowchartBlankSchema),
});
export type NoteTableFlowchartAnswer = z.infer<typeof NoteTableFlowchartAnswerSchema>;

// Diagram Labelling options (R14)
export const DiagramLabellingOptionsSchema = z.object({
  diagramUrl: z.string().min(1),
  labelPositions: z.array(z.string()).min(1),
  wordBank: z.array(z.string()).optional(),
  wordLimit: z.number().int().min(1).max(5).default(2),
});
export type DiagramLabellingOptions = z.infer<typeof DiagramLabellingOptionsSchema>;

// Diagram Labelling answer (R14) — Story 3.5: union type for word-bank (string) and free-text (structured) modes
export const DiagramLabellingStructuredLabelSchema = z.object({
  answer: z.string(),
  acceptedVariants: z.array(z.string()).default([]),
  strictWordOrder: z.boolean().default(true),
});
export type DiagramLabellingStructuredLabel = z.infer<typeof DiagramLabellingStructuredLabelSchema>;

export const DiagramLabellingAnswerSchema = z.object({
  labels: z.record(z.string(), z.union([
    z.string(),
    DiagramLabellingStructuredLabelSchema,
  ])),
});
export type DiagramLabellingAnswer = z.infer<typeof DiagramLabellingAnswerSchema>;

// Writing rubric schemas (informational — actual scoring is Epic 5)
export const WritingRubricCriterionSchema = z.object({
  name: z.string().min(1),
  band: z.number().min(0).max(9).multipleOf(0.5),
  comment: z.string().optional(),
});
export type WritingRubricCriterion = z.infer<typeof WritingRubricCriterionSchema>;

export const WritingRubricSchema = z.object({
  criteria: z.array(WritingRubricCriterionSchema).length(4),
});
export type WritingRubric = z.infer<typeof WritingRubricSchema>;

// Writing tasks have no auto-gradable correct answer — grading is rubric-based (Epic 5)
export const WritingAnswerSchema = z.null();

// IELTS Writing rubric criteria names by task type
export const WRITING_RUBRIC_CRITERIA = {
  TASK1: [
    "Task Achievement",
    "Coherence & Cohesion",
    "Lexical Resource",
    "Grammatical Range & Accuracy",
  ],
  TASK2: [
    "Task Response",
    "Coherence & Cohesion",
    "Lexical Resource",
    "Grammatical Range & Accuracy",
  ],
} as const;

// S2: Speaking Cue Card structured data (topic + bullet points)
export const SpeakingCueCardSchema = z.object({
  topic: z.string().min(1),
  bulletPoints: z.array(z.string().min(1)).min(1).max(6),
});
export type SpeakingCueCard = z.infer<typeof SpeakingCueCardSchema>;

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
  // R13: Note/Table/Flowchart Completion
  z.object({
    questionType: z.literal("R13_NOTE_TABLE_FLOWCHART"),
    options: NoteTableFlowchartOptionsSchema,
    correctAnswer: NoteTableFlowchartAnswerSchema,
  }),
  // R14: Diagram Labelling
  z.object({
    questionType: z.literal("R14_DIAGRAM_LABELLING"),
    options: DiagramLabellingOptionsSchema,
    correctAnswer: DiagramLabellingAnswerSchema,
  }),
  // L1: Form/Note/Table Completion (same schemas as R13)
  z.object({
    questionType: z.literal("L1_FORM_NOTE_TABLE"),
    options: NoteTableFlowchartOptionsSchema,
    correctAnswer: NoteTableFlowchartAnswerSchema,
  }),
  // L2: MCQ (same schemas as R1 single-answer)
  z.object({
    questionType: z.literal("L2_MCQ"),
    options: MCQOptionsSchema,
    correctAnswer: MCQSingleAnswerSchema,
  }),
  // L3: Matching (same schemas as R11)
  z.object({
    questionType: z.literal("L3_MATCHING"),
    options: MatchingOptionsSchema,
    correctAnswer: MatchingAnswerSchema,
  }),
  // L4: Map/Plan Labelling (same schemas as R14)
  z.object({
    questionType: z.literal("L4_MAP_PLAN_LABELLING"),
    options: DiagramLabellingOptionsSchema,
    correctAnswer: DiagramLabellingAnswerSchema,
  }),
  // L5: Sentence Completion (same schemas as R5)
  z.object({
    questionType: z.literal("L5_SENTENCE_COMPLETION"),
    options: z.null(),
    correctAnswer: TextAnswerSchema,
  }),
  // L6: Short Answer (same schemas as R6)
  z.object({
    questionType: z.literal("L6_SHORT_ANSWER"),
    options: z.null(),
    correctAnswer: TextAnswerSchema,
  }),
  // W1: Task 1 Academic (writing — no options or correct answer, rubric-graded)
  z.object({
    questionType: z.literal("W1_TASK1_ACADEMIC"),
    options: z.null(),
    correctAnswer: z.null(),
  }),
  // W2: Task 1 General (writing — no options or correct answer, rubric-graded)
  z.object({
    questionType: z.literal("W2_TASK1_GENERAL"),
    options: z.null(),
    correctAnswer: z.null(),
  }),
  // W3: Task 2 Essay (writing — no options or correct answer, rubric-graded)
  z.object({
    questionType: z.literal("W3_TASK2_ESSAY"),
    options: z.null(),
    correctAnswer: z.null(),
  }),
  // S1: Part 1 Q&A (speaking — no options or correct answer, rubric-graded)
  z.object({
    questionType: z.literal("S1_PART1_QA"),
    options: z.null(),
    correctAnswer: z.null(),
  }),
  // S2: Part 2 Cue Card (speaking — cue card options, rubric-graded)
  z.object({
    questionType: z.literal("S2_PART2_CUE_CARD"),
    options: SpeakingCueCardSchema,
    correctAnswer: z.null(),
  }),
  // S3: Part 3 Discussion (speaking — no options or correct answer, rubric-graded)
  z.object({
    questionType: z.literal("S3_PART3_DISCUSSION"),
    options: z.null(),
    correctAnswer: z.null(),
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
  audioSectionIndex: z.number().int().min(0).nullable().optional(),
  sectionTimeLimit: z.number().int().positive().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  questions: z.array(QuestionSchema).optional(),
});
export type QuestionSection = z.infer<typeof QuestionSectionSchema>;

export const CreateQuestionSectionSchema = z.object({
  sectionType: IeltsQuestionTypeSchema,
  instructions: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0),
  audioSectionIndex: z.number().int().min(0).nullable().optional(),
  sectionTimeLimit: z.number().int().positive().nullable().optional(),
});
export type CreateQuestionSectionInput = z.infer<
  typeof CreateQuestionSectionSchema
>;

export const UpdateQuestionSectionSchema = CreateQuestionSectionSchema.partial();
export type UpdateQuestionSectionInput = z.infer<
  typeof UpdateQuestionSectionSchema
>;

export const ReorderSectionsSchema = z.object({
  sectionIds: z.array(z.string()).min(1),
});
export type ReorderSectionsInput = z.infer<typeof ReorderSectionsSchema>;

// --- Exercise Tags ---

export const ExerciseTagSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  name: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  _count: z.object({
    tagAssignments: z.number(),
  }).optional(),
});
export type ExerciseTag = z.infer<typeof ExerciseTagSchema>;

export const CreateExerciseTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});
export type CreateExerciseTagInput = z.infer<typeof CreateExerciseTagSchema>;

export const UpdateExerciseTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});
export type UpdateExerciseTagInput = z.infer<typeof UpdateExerciseTagSchema>;

export const MergeExerciseTagsSchema = z.object({
  sourceTagId: z.string(),
  targetTagId: z.string(),
});
export type MergeExerciseTagsInput = z.infer<typeof MergeExerciseTagsSchema>;

export const SetExerciseTagsSchema = z.object({
  tagIds: z.array(z.string()),
});
export type SetExerciseTagsInput = z.infer<typeof SetExerciseTagsSchema>;

// --- Timer ---

export const TimerPositionSchema = z.enum(["top-bar", "floating"]);
export type TimerPosition = z.infer<typeof TimerPositionSchema>;

export const WarningAlertsSchema = z.array(z.number().int().positive()).nullable().optional();

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
  passageSourceType: z.string().nullable().optional(),
  passageSourceUrl: z.string().nullable().optional(),
  caseSensitive: z.boolean().default(false),
  partialCredit: z.boolean().default(false),
  audioUrl: z.string().nullable().optional(),
  audioDuration: z.number().nullable().optional(),
  // Permissive in response schema — Prisma returns string/JsonValue, strict validation is on input schemas
  playbackMode: z.string().nullable().optional(),
  audioSections: z.unknown().nullable().optional(),
  showTranscriptAfterSubmit: z.boolean().optional().default(false),
  stimulusImageUrl: z.string().nullable().optional(),
  writingPrompt: z.string().nullable().optional(),
  letterTone: z.string().nullable().optional(),
  wordCountMin: z.number().nullable().optional(),
  wordCountMax: z.number().nullable().optional(),
  wordCountMode: z.string().nullable().optional(),
  sampleResponse: z.string().nullable().optional(),
  showSampleAfterGrading: z.boolean().optional().default(false),
  speakingPrepTime: z.number().nullable().optional(),
  speakingTime: z.number().nullable().optional(),
  maxRecordingDuration: z.number().nullable().optional(),
  enableTranscription: z.boolean().optional().default(false),
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: z.string().nullable().optional(),
  warningAlerts: z.unknown().nullable().optional(),
  autoSubmitOnExpiry: z.boolean().optional().default(true),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional().default(false),
  bandLevel: z.string().nullable().optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
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
  caseSensitive: z.boolean().optional(),
  partialCredit: z.boolean().optional(),
  playbackMode: PlaybackModeSchema.optional(),
  showTranscriptAfterSubmit: z.boolean().optional(),
  writingPrompt: z.string().nullable().optional(),
  letterTone: LetterToneSchema.nullable().optional(),
  wordCountMin: z.number().int().positive().nullable().optional(),
  wordCountMax: z.number().int().positive().nullable().optional(),
  wordCountMode: WordCountModeSchema.nullable().optional(),
  sampleResponse: z.string().nullable().optional(),
  showSampleAfterGrading: z.boolean().optional(),
  speakingPrepTime: z.number().int().positive().nullable().optional(),
  speakingTime: z.number().int().positive().nullable().optional(),
  maxRecordingDuration: z.number().int().positive().nullable().optional(),
  enableTranscription: z.boolean().optional(),
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: TimerPositionSchema.nullable().optional(),
  warningAlerts: WarningAlertsSchema,
  autoSubmitOnExpiry: z.boolean().optional(),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional(),
  bandLevel: BandLevelSchema.nullable().optional(),
}).refine(
  (data) => {
    if (data.wordCountMin != null && data.wordCountMax != null) {
      return data.wordCountMax >= data.wordCountMin;
    }
    return true;
  },
  { message: "wordCountMax must be >= wordCountMin", path: ["wordCountMax"] },
);
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

export const UpdateExerciseSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  instructions: z.string().nullable().optional(),
  passageContent: z.string().nullable().optional(),
  passageFormat: z.string().nullable().optional(),
  caseSensitive: z.boolean().optional(),
  partialCredit: z.boolean().optional(),
  audioDuration: z.number().nullable().optional(),
  playbackMode: PlaybackModeSchema.optional(),
  audioSections: z.array(AudioSectionSchema).nullable().optional(),
  showTranscriptAfterSubmit: z.boolean().optional(),
  writingPrompt: z.string().nullable().optional(),
  letterTone: LetterToneSchema.nullable().optional(),
  wordCountMin: z.number().int().positive().nullable().optional(),
  wordCountMax: z.number().int().positive().nullable().optional(),
  wordCountMode: WordCountModeSchema.nullable().optional(),
  sampleResponse: z.string().nullable().optional(),
  showSampleAfterGrading: z.boolean().optional(),
  speakingPrepTime: z.number().int().positive().nullable().optional(),
  speakingTime: z.number().int().positive().nullable().optional(),
  maxRecordingDuration: z.number().int().positive().nullable().optional(),
  enableTranscription: z.boolean().optional(),
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: TimerPositionSchema.nullable().optional(),
  warningAlerts: WarningAlertsSchema,
  autoSubmitOnExpiry: z.boolean().optional(),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional(),
  bandLevel: BandLevelSchema.nullable().optional(),
}).refine(
  (data) => {
    if (data.wordCountMin != null && data.wordCountMax != null) {
      return data.wordCountMax >= data.wordCountMin;
    }
    return true;
  },
  { message: "wordCountMax must be >= wordCountMin", path: ["wordCountMax"] },
);
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseSchema>;

export const AutosaveExerciseSchema = z.object({
  title: z.string().optional(),
  instructions: z.string().nullable().optional(),
  passageContent: z.string().nullable().optional(),
  passageFormat: z.string().nullable().optional(),
  caseSensitive: z.boolean().optional(),
  partialCredit: z.boolean().optional(),
  playbackMode: PlaybackModeSchema.optional(),
  audioSections: z.array(AudioSectionSchema).nullable().optional(),
  showTranscriptAfterSubmit: z.boolean().optional(),
  writingPrompt: z.string().nullable().optional(),
  letterTone: LetterToneSchema.nullable().optional(),
  wordCountMin: z.number().int().positive().nullable().optional(),
  wordCountMax: z.number().int().positive().nullable().optional(),
  wordCountMode: WordCountModeSchema.nullable().optional(),
  sampleResponse: z.string().nullable().optional(),
  showSampleAfterGrading: z.boolean().optional(),
  speakingPrepTime: z.number().int().positive().nullable().optional(),
  speakingTime: z.number().int().positive().nullable().optional(),
  maxRecordingDuration: z.number().int().positive().nullable().optional(),
  enableTranscription: z.boolean().optional(),
  timeLimit: z.number().int().positive().nullable().optional(),
  timerPosition: TimerPositionSchema.nullable().optional(),
  warningAlerts: z.array(z.number().int().positive()).nullable().optional(),
  autoSubmitOnExpiry: z.boolean().optional(),
  gracePeriodSeconds: z.number().int().positive().nullable().optional(),
  enablePause: z.boolean().optional(),
  bandLevel: BandLevelSchema.nullable().optional(),
});
export type AutosaveExerciseInput = z.infer<typeof AutosaveExerciseSchema>;

// --- Bulk Action Schemas ---

export const BulkExerciseIdsSchema = z.object({
  exerciseIds: z.array(z.string()).min(1).max(100),
});
export type BulkExerciseIds = z.infer<typeof BulkExerciseIdsSchema>;

export const BulkTagSchema = z.object({
  exerciseIds: z.array(z.string()).min(1).max(100),
  tagIds: z.array(z.string()).min(1).max(50),
});
export type BulkTag = z.infer<typeof BulkTagSchema>;

export const BulkResultSchema = z.object({
  count: z.number(),
});
export const BulkResultResponseSchema = createResponseSchema(BulkResultSchema);
export const BulkDuplicateResponseSchema = createResponseSchema(z.array(ExerciseSchema));

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

export const ReorderSectionsResponseSchema = createResponseSchema(
  z.array(QuestionSectionSchema),
);
export type ReorderSectionsResponse = z.infer<
  typeof ReorderSectionsResponseSchema
>;

export const QuestionResponseSchema = createResponseSchema(QuestionSchema);
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const QuestionListResponseSchema = createResponseSchema(
  z.array(QuestionSchema),
);
export type QuestionListResponse = z.infer<typeof QuestionListResponseSchema>;

export const ExerciseTagResponseSchema = createResponseSchema(ExerciseTagSchema);
export type ExerciseTagResponse = z.infer<typeof ExerciseTagResponseSchema>;

export const ExerciseTagListResponseSchema = createResponseSchema(z.array(ExerciseTagSchema));
export type ExerciseTagListResponse = z.infer<typeof ExerciseTagListResponseSchema>;
