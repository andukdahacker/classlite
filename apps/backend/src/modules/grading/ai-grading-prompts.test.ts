import { describe, it, expect } from "vitest";
import { getGradingPromptAndSchema } from "./ai-grading-prompts.js";

describe("ai-grading-prompts", () => {
  describe("getGradingPromptAndSchema", () => {
    it("should return Writing prompt with band descriptors", () => {
      const result = getGradingPromptAndSchema(
        "WRITING",
        "This is a student essay about environmental issues.",
        "Write an essay about climate change.",
      );

      expect(result.systemPrompt).toContain("IELTS examiner");
      expect(result.systemPrompt).toContain("Task Achievement");
      expect(result.systemPrompt).toContain("Coherence and Cohesion");
      expect(result.systemPrompt).toContain("Lexical Resource");
      expect(result.systemPrompt).toContain("Grammatical Range");
      expect(result.systemPrompt).toContain("student essay about environmental");
      expect(result.systemPrompt).toContain("Write an essay about climate change");
      expect(result.schema).toBeDefined();
    });

    it("should return Speaking prompt with pronunciation caveat", () => {
      const result = getGradingPromptAndSchema(
        "SPEAKING",
        "I think that education is very important.",
      );

      expect(result.systemPrompt).toContain("IELTS examiner");
      expect(result.systemPrompt).toContain("Fluency and Coherence");
      expect(result.systemPrompt).toContain("Pronunciation");
      expect(result.systemPrompt).toContain("limited accuracy");
      expect(result.systemPrompt).toContain("education is very important");
      expect(result.schema).toBeDefined();
    });

    it("should include question prompt when provided for Writing", () => {
      const result = getGradingPromptAndSchema(
        "WRITING",
        "Student text here.",
        "Describe the graph showing population growth.",
      );

      expect(result.systemPrompt).toContain("TASK PROMPT:");
      expect(result.systemPrompt).toContain("Describe the graph showing population growth");
    });

    it("should include speaking prompt when provided", () => {
      const result = getGradingPromptAndSchema(
        "SPEAKING",
        "I went to London last summer.",
        "Describe a trip you enjoyed.",
      );

      expect(result.systemPrompt).toContain("SPEAKING PROMPT:");
      expect(result.systemPrompt).toContain("Describe a trip you enjoyed");
    });

    it("should omit prompt section when no question prompt given", () => {
      const result = getGradingPromptAndSchema(
        "WRITING",
        "Student text here.",
      );

      expect(result.systemPrompt).not.toContain("TASK PROMPT:");
    });

    it("Writing schema should validate valid grading response", () => {
      const { schema } = getGradingPromptAndSchema("WRITING", "text");

      const validResponse = {
        overallScore: 6.5,
        criteriaScores: {
          taskAchievement: 6.0,
          coherence: 7.0,
          lexicalResource: 6.5,
          grammaticalRange: 6.5,
        },
        generalFeedback: "Good essay overall.",
        highlights: [
          {
            type: "grammar",
            startOffset: 0,
            endOffset: 10,
            content: "Subject-verb agreement error",
            suggestedFix: "were",
            severity: "error",
            confidence: 0.95,
            originalContextSnippet: "the student were",
          },
        ],
      };

      const parsed = schema.parse(validResponse);
      expect(parsed).toBeTruthy();
      expect((parsed as Record<string, unknown>).overallScore).toBe(6.5);
    });

    it("Speaking schema should validate valid grading response", () => {
      const { schema } = getGradingPromptAndSchema("SPEAKING", "text");

      const validResponse = {
        overallScore: 7.0,
        criteriaScores: {
          fluency: 7.0,
          lexicalResource: 7.0,
          grammaticalRange: 6.5,
          pronunciation: 6.5,
        },
        generalFeedback: "Good fluency and vocabulary.",
        highlights: [],
      };

      const parsed = schema.parse(validResponse);
      expect(parsed).toBeTruthy();
      expect((parsed as Record<string, unknown>).overallScore).toBe(7.0);
    });
  });
});
