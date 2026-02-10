import { describe, it, expect } from "vitest";
import {
  AIGenerableQuestionTypeSchema,
  DifficultyLevelSchema,
  QuestionTypeRequestSchema,
  GenerateQuestionsRequestSchema,
  RegenerateQuestionsSectionRequestSchema,
  AIGenerationJobStatusSchema,
  AIGenerationJobSchema,
} from "./ai-generation.js";

describe("AI Generation Schemas", () => {
  describe("AIGenerableQuestionTypeSchema", () => {
    it.each([
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
    ])("should accept %s", (type) => {
      expect(AIGenerableQuestionTypeSchema.safeParse(type).success).toBe(true);
    });

    it("should reject non-reading types", () => {
      expect(AIGenerableQuestionTypeSchema.safeParse("L1_FORM_NOTE_TABLE").success).toBe(false);
      expect(AIGenerableQuestionTypeSchema.safeParse("W1_TASK1_ACADEMIC").success).toBe(false);
      expect(AIGenerableQuestionTypeSchema.safeParse("S1_PART1_QA").success).toBe(false);
    });

    it("should reject invalid types", () => {
      expect(AIGenerableQuestionTypeSchema.safeParse("INVALID").success).toBe(false);
      expect(AIGenerableQuestionTypeSchema.safeParse("").success).toBe(false);
    });
  });

  describe("DifficultyLevelSchema", () => {
    it.each(["easy", "medium", "hard"])("should accept %s", (level) => {
      expect(DifficultyLevelSchema.safeParse(level).success).toBe(true);
    });

    it("should reject invalid levels", () => {
      expect(DifficultyLevelSchema.safeParse("expert").success).toBe(false);
      expect(DifficultyLevelSchema.safeParse("").success).toBe(false);
    });
  });

  describe("QuestionTypeRequestSchema", () => {
    it("should accept valid type and count", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "R1_MCQ_SINGLE",
        count: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should accept count of 1 (min)", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "R3_TFNG",
        count: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should accept count of 20 (max)", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "R3_TFNG",
        count: 20,
      });
      expect(result.success).toBe(true);
    });

    it("should reject count of 0", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "R1_MCQ_SINGLE",
        count: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject count above 20", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "R1_MCQ_SINGLE",
        count: 21,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer count", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "R1_MCQ_SINGLE",
        count: 5.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid question type", () => {
      const result = QuestionTypeRequestSchema.safeParse({
        type: "L1_FORM_NOTE_TABLE",
        count: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GenerateQuestionsRequestSchema", () => {
    it("should accept valid request with single type", () => {
      const result = GenerateQuestionsRequestSchema.safeParse({
        questionTypes: [{ type: "R1_MCQ_SINGLE", count: 5 }],
        difficulty: "medium",
      });
      expect(result.success).toBe(true);
    });

    it("should accept multiple question types", () => {
      const result = GenerateQuestionsRequestSchema.safeParse({
        questionTypes: [
          { type: "R1_MCQ_SINGLE", count: 5 },
          { type: "R3_TFNG", count: 3 },
          { type: "R9_MATCHING_HEADINGS", count: 1 },
        ],
        difficulty: "hard",
      });
      expect(result.success).toBe(true);
    });

    it("should default difficulty to medium", () => {
      const result = GenerateQuestionsRequestSchema.safeParse({
        questionTypes: [{ type: "R1_MCQ_SINGLE", count: 5 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficulty).toBe("medium");
      }
    });

    it("should reject empty questionTypes array", () => {
      const result = GenerateQuestionsRequestSchema.safeParse({
        questionTypes: [],
        difficulty: "easy",
      });
      expect(result.success).toBe(false);
    });

    it("should reject more than 10 question types", () => {
      const types = Array.from({ length: 11 }, (_, i) => ({
        type: `R${(i % 14) + 1}_MCQ_SINGLE`,
        count: 1,
      }));
      const result = GenerateQuestionsRequestSchema.safeParse({
        questionTypes: types,
        difficulty: "easy",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RegenerateQuestionsSectionRequestSchema", () => {
    it("should accept valid regeneration request", () => {
      const result = RegenerateQuestionsSectionRequestSchema.safeParse({
        sectionId: "section-123",
        difficulty: "hard",
      });
      expect(result.success).toBe(true);
    });

    it("should accept without difficulty (optional)", () => {
      const result = RegenerateQuestionsSectionRequestSchema.safeParse({
        sectionId: "section-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing sectionId", () => {
      const result = RegenerateQuestionsSectionRequestSchema.safeParse({
        difficulty: "easy",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("AIGenerationJobStatusSchema", () => {
    it.each(["pending", "processing", "completed", "failed"])(
      "should accept %s",
      (status) => {
        expect(AIGenerationJobStatusSchema.safeParse(status).success).toBe(true);
      },
    );

    it("should reject invalid status", () => {
      expect(AIGenerationJobStatusSchema.safeParse("running").success).toBe(false);
      expect(AIGenerationJobStatusSchema.safeParse("").success).toBe(false);
    });
  });

  describe("AIGenerationJobSchema", () => {
    const validJob = {
      id: "job-1",
      centerId: "center-1",
      exerciseId: "ex-1",
      status: "pending",
      questionTypes: [{ type: "R1_MCQ_SINGLE", count: 5 }],
      difficulty: "medium",
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should accept a valid job", () => {
      const result = AIGenerationJobSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it("should accept Date objects for timestamps", () => {
      const result = AIGenerationJobSchema.safeParse({
        ...validJob,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should accept null difficulty", () => {
      const result = AIGenerationJobSchema.safeParse({
        ...validJob,
        difficulty: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept error string when failed", () => {
      const result = AIGenerationJobSchema.safeParse({
        ...validJob,
        status: "failed",
        error: "AI generation timeout",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const { id: _, ...noId } = validJob;
      expect(AIGenerationJobSchema.safeParse(noId).success).toBe(false);

      const { exerciseId: __, ...noExerciseId } = validJob;
      expect(AIGenerationJobSchema.safeParse(noExerciseId).success).toBe(false);
    });

    it("should reject invalid status", () => {
      const result = AIGenerationJobSchema.safeParse({
        ...validJob,
        status: "running",
      });
      expect(result.success).toBe(false);
    });
  });
});
