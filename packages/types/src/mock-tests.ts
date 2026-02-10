import { z } from "zod";
import { createResponseSchema } from "./response.js";

// Enums
export const MockTestTypeSchema = z.enum(["ACADEMIC", "GENERAL_TRAINING"]);
export type MockTestType = z.infer<typeof MockTestTypeSchema>;

export const MockTestStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type MockTestStatus = z.infer<typeof MockTestStatusSchema>;

export const MockTestSkillSchema = z.enum([
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
]);
export type MockTestSkill = z.infer<typeof MockTestSkillSchema>;

// Section Exercise (junction)
export const MockTestSectionExerciseSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  exerciseId: z.string(),
  orderIndex: z.number(),
  exercise: z
    .object({
      id: z.string(),
      title: z.string(),
      skill: z.string(),
      status: z.string(),
      bandLevel: z.string().nullable().optional(),
      sections: z
        .array(
          z.object({
            id: z.string(),
            sectionType: z.string(),
            questions: z.array(z.object({ id: z.string() })),
          }),
        )
        .optional(),
    })
    .optional(),
});

// Section
export const MockTestSectionSchema = z.object({
  id: z.string(),
  mockTestId: z.string(),
  skill: MockTestSkillSchema,
  orderIndex: z.number(),
  timeLimit: z.number().nullable().optional(),
  exercises: z.array(MockTestSectionExerciseSchema).optional(),
});

// Full MockTest
export const MockTestSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  testType: MockTestTypeSchema,
  status: MockTestStatusSchema,
  createdById: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string() }).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  sections: z.array(MockTestSectionSchema).optional(),
});
export type MockTest = z.infer<typeof MockTestSchema>;

// Create input
export const CreateMockTestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  testType: MockTestTypeSchema.default("ACADEMIC"),
});
export type CreateMockTest = z.infer<typeof CreateMockTestSchema>;

// Update input
export const UpdateMockTestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  testType: MockTestTypeSchema.optional(),
});
export type UpdateMockTest = z.infer<typeof UpdateMockTestSchema>;

// Section update (timing)
export const UpdateMockTestSectionSchema = z.object({
  timeLimit: z.number().int().min(60).max(14400).nullable().optional(),
});

// Add exercise to section
export const AddExerciseToSectionSchema = z.object({
  exerciseId: z.string(),
});

// Reorder exercises in section
export const ReorderSectionExercisesSchema = z.object({
  exerciseIds: z.array(z.string()).min(1),
});

// Response schemas
export const MockTestResponseSchema = createResponseSchema(MockTestSchema);
export const MockTestListResponseSchema = createResponseSchema(
  z.array(MockTestSchema),
);
export const MockTestSectionResponseSchema =
  createResponseSchema(MockTestSectionSchema);
export const MockTestSectionExerciseResponseSchema =
  createResponseSchema(MockTestSectionExerciseSchema);

// Band score result
export const SkillBandScoreSchema = z.object({
  skill: MockTestSkillSchema,
  rawScore: z.number().nullable().optional(),
  criteriaScores: z.record(z.string(), z.number()).nullable().optional(),
  bandScore: z.number(),
});

export const MockTestBandScoreSchema = z.object({
  testType: MockTestTypeSchema,
  skills: z.array(SkillBandScoreSchema),
  overallBand: z.number(),
});
export type MockTestBandScore = z.infer<typeof MockTestBandScoreSchema>;

export const MockTestBandScoreResponseSchema = createResponseSchema(
  MockTestBandScoreSchema,
);

// Score preview (question counts and criteria per section)
export const ScorePreviewSkillSchema = z.object({
  questionCount: z.number(),
  maxRawScore: z.number().optional(),
  criteria: z.array(z.string()).optional(),
});

export const ScorePreviewSchema = z.object({
  testType: MockTestTypeSchema,
  listening: ScorePreviewSkillSchema.optional(),
  reading: ScorePreviewSkillSchema.optional(),
  writing: ScorePreviewSkillSchema.optional(),
  speaking: ScorePreviewSkillSchema.optional(),
});

export const ScorePreviewResponseSchema =
  createResponseSchema(ScorePreviewSchema);
