import { describe, it, expect } from "vitest";
import { normalizeAnswer, matchesAnswer, checkWordLimit, migrateNtfAnswer, matchesExactMapping, normalizeAnswerOnSave, normalizeCorrectAnswer } from "./answer-utils.js";

describe("answer-utils", () => {
  // --- Task 2.1: normalizeAnswer ---
  describe("normalizeAnswer", () => {
    it("should trim leading and trailing whitespace", () => {
      expect(normalizeAnswer("  hello  ")).toBe("hello");
    });

    it("should collapse multiple spaces to single space", () => {
      expect(normalizeAnswer("the   industrial    revolution")).toBe(
        "the industrial revolution",
      );
    });

    it("should lowercase the text", () => {
      expect(normalizeAnswer("The Industrial Revolution")).toBe(
        "the industrial revolution",
      );
    });

    it("should handle combined normalization", () => {
      expect(normalizeAnswer("  The   INDUSTRIAL  Revolution  ")).toBe(
        "the industrial revolution",
      );
    });

    it("should handle empty string", () => {
      expect(normalizeAnswer("")).toBe("");
    });

    it("should handle single word", () => {
      expect(normalizeAnswer("  Word  ")).toBe("word");
    });

    it("should handle tabs and newlines as whitespace", () => {
      expect(normalizeAnswer("hello\t\tworld\n")).toBe("hello world");
    });
  });

  // --- Task 2.2: matchesAnswer ---
  describe("matchesAnswer", () => {
    it("should match exact answer (case-insensitive)", () => {
      expect(
        matchesAnswer("the industrial revolution", "the industrial revolution", [], false),
      ).toBe(true);
    });

    it("should match case-insensitively by default", () => {
      expect(
        matchesAnswer("The Industrial Revolution", "the industrial revolution", [], false),
      ).toBe(true);
    });

    it("should match with normalization (extra spaces)", () => {
      expect(
        matchesAnswer("  the   industrial  revolution  ", "the industrial revolution", [], false),
      ).toBe(true);
    });

    it("should match accepted variant", () => {
      expect(
        matchesAnswer("19", "nineteen", ["19", "Nineteen"], false),
      ).toBe(true);
    });

    it("should match variant case-insensitively", () => {
      expect(
        matchesAnswer("NINETEEN", "nineteen", ["19", "Nineteen"], false),
      ).toBe(true);
    });

    it("should reject non-matching answer", () => {
      expect(
        matchesAnswer("twenty", "nineteen", ["19"], false),
      ).toBe(false);
    });

    it("should enforce case sensitivity when caseSensitive is true", () => {
      expect(
        matchesAnswer("The Answer", "the answer", [], true),
      ).toBe(false);
    });

    it("should match exact case when caseSensitive is true", () => {
      expect(
        matchesAnswer("the answer", "the answer", [], true),
      ).toBe(true);
    });

    it("should still normalize whitespace when caseSensitive is true", () => {
      expect(
        matchesAnswer("  the   answer  ", "the answer", [], true),
      ).toBe(true);
    });

    it("should check variants with case sensitivity", () => {
      expect(
        matchesAnswer("UK", "United Kingdom", ["UK", "U.K."], true),
      ).toBe(true);
    });

    it("should reject variant with wrong case when caseSensitive is true", () => {
      expect(
        matchesAnswer("uk", "United Kingdom", ["UK"], true),
      ).toBe(false);
    });
  });

  // --- Task 2.3: checkWordLimit ---
  describe("checkWordLimit", () => {
    it("should pass when within word limit", () => {
      expect(checkWordLimit("one two", 3)).toBe(true);
    });

    it("should pass when exactly at word limit", () => {
      expect(checkWordLimit("one two three", 3)).toBe(true);
    });

    it("should fail when exceeding word limit", () => {
      expect(checkWordLimit("one two three four", 3)).toBe(false);
    });

    it("should handle single word", () => {
      expect(checkWordLimit("word", 1)).toBe(true);
    });

    it("should handle empty string", () => {
      expect(checkWordLimit("", 1)).toBe(true);
    });

    it("should handle extra spaces (collapse before counting)", () => {
      expect(checkWordLimit("  one   two   three  ", 3)).toBe(true);
    });

    it("should handle extra spaces that look like more words", () => {
      expect(checkWordLimit("  one   two  ", 2)).toBe(true);
    });
  });

  // --- Story 3.5 Task 5: matchesAnswer with strictWordOrder ---
  describe("matchesAnswer with strictWordOrder", () => {
    it("should match 'carbon dioxide' vs 'dioxide carbon' when strict=false", () => {
      expect(
        matchesAnswer("dioxide carbon", "carbon dioxide", [], false, false),
      ).toBe(true);
    });

    it("should reject different word order when strict=true (default)", () => {
      expect(
        matchesAnswer("dioxide carbon", "carbon dioxide", [], false, true),
      ).toBe(false);
    });

    it("should match single word with strict=false", () => {
      expect(
        matchesAnswer("cat", "cat", [], false, false),
      ).toBe(true);
    });

    it("should handle empty string with strict=false", () => {
      expect(
        matchesAnswer("", "", [], false, false),
      ).toBe(true);
    });

    it("should match variant with different word order when strict=false", () => {
      expect(
        matchesAnswer("revolution industrial", "industrial revolution", ["the revolution industrial"], false, false),
      ).toBe(true);
    });

    it("should match variant in any word order when strict=false", () => {
      expect(
        matchesAnswer("industrial the revolution", "industrial revolution", ["the industrial revolution"], false, false),
      ).toBe(true);
    });

    it("should match IELTS-realistic: 'fifteen percent' vs 'percent fifteen' when strict=false", () => {
      expect(
        matchesAnswer("percent fifteen", "fifteen percent", [], false, false),
      ).toBe(true);
    });

    it("should match case-insensitively with strict=false", () => {
      expect(
        matchesAnswer("DIOXIDE CARBON", "carbon dioxide", [], false, false),
      ).toBe(true);
    });

    it("should respect caseSensitive with strict=false", () => {
      expect(
        matchesAnswer("DIOXIDE CARBON", "carbon dioxide", [], true, false),
      ).toBe(false);
    });

    it("should reject student answer with duplicate words that match via Set collapse", () => {
      // "the the cat" should NOT match "the cat" — different word counts
      expect(
        matchesAnswer("the the cat", "the cat", [], false, false),
      ).toBe(false);
    });

    it("should match when both answers have same duplicate words in different order", () => {
      // "the the" should match "the the" regardless of order (trivial)
      expect(
        matchesAnswer("the the", "the the", [], false, false),
      ).toBe(true);
    });

    it("should default strictWordOrder to true (backward compat with 4-arg calls)", () => {
      // Existing 4-arg calls should still work — strictWordOrder defaults to true
      expect(
        matchesAnswer("dioxide carbon", "carbon dioxide", [], false),
      ).toBe(false);
    });
  });

  // --- Story 3.5 Task 5: matchesExactMapping ---
  describe("matchesExactMapping", () => {
    it("should score full match correctly", () => {
      const result = matchesExactMapping(
        { "1": "A", "2": "B", "3": "C" },
        { "1": "A", "2": "B", "3": "C" },
      );
      expect(result).toEqual({ correct: 3, total: 3, score: 1 });
    });

    it("should score partial match (2/3)", () => {
      const result = matchesExactMapping(
        { "1": "A", "2": "X", "3": "C" },
        { "1": "A", "2": "B", "3": "C" },
      );
      expect(result).toEqual({ correct: 2, total: 3, score: 2 / 3 });
    });

    it("should score zero match", () => {
      const result = matchesExactMapping(
        { "1": "X", "2": "Y" },
        { "1": "A", "2": "B" },
      );
      expect(result).toEqual({ correct: 0, total: 2, score: 0 });
    });

    it("should handle empty mappings", () => {
      const result = matchesExactMapping({}, {});
      expect(result).toEqual({ correct: 0, total: 0, score: 0 });
    });

    it("should handle missing keys in student answers", () => {
      const result = matchesExactMapping(
        { "1": "A" },
        { "1": "A", "2": "B", "3": "C" },
      );
      expect(result).toEqual({ correct: 1, total: 3, score: 1 / 3 });
    });

    it("should ignore extra keys in student answers", () => {
      const result = matchesExactMapping(
        { "1": "A", "2": "B", "99": "Z" },
        { "1": "A", "2": "B" },
      );
      expect(result).toEqual({ correct: 2, total: 2, score: 1 });
    });
  });

  // --- Story 3.5 Task 3: migrateNtfAnswer ---
  describe("migrateNtfAnswer", () => {
    it("should migrate flat string values to structured format", () => {
      const result = migrateNtfAnswer({ "1": "fifteen percent", "2": "developing nations" });
      expect(result).toEqual({
        "1": { answer: "fifteen percent", acceptedVariants: [], strictWordOrder: true },
        "2": { answer: "developing nations", acceptedVariants: [], strictWordOrder: true },
      });
    });

    it("should pass through already-structured values", () => {
      const structured = {
        "1": { answer: "carbon dioxide", acceptedVariants: ["CO2"], strictWordOrder: false },
      };
      const result = migrateNtfAnswer(structured);
      expect(result).toEqual(structured);
    });

    it("should handle mixed flat and structured values", () => {
      const result = migrateNtfAnswer({
        "1": "flat answer",
        "2": { answer: "structured", acceptedVariants: ["alt"], strictWordOrder: true },
      });
      expect(result["1"]).toEqual({ answer: "flat answer", acceptedVariants: [], strictWordOrder: true });
      expect(result["2"]).toEqual({ answer: "structured", acceptedVariants: ["alt"], strictWordOrder: true });
    });

    it("should handle empty object", () => {
      const result = migrateNtfAnswer({});
      expect(result).toEqual({});
    });

    it("should default acceptedVariants and strictWordOrder for partial structured objects", () => {
      const result = migrateNtfAnswer({ "1": { answer: "test" } });
      expect(result["1"]).toEqual({ answer: "test", acceptedVariants: [], strictWordOrder: true });
    });
  });

  // --- Story 3.5 Task 6: normalizeAnswerOnSave ---
  describe("normalizeAnswerOnSave", () => {
    it("should trim leading and trailing whitespace", () => {
      expect(normalizeAnswerOnSave("  hello  ")).toBe("hello");
    });

    it("should collapse multiple spaces to single space", () => {
      expect(normalizeAnswerOnSave("the   industrial    revolution")).toBe(
        "the industrial revolution",
      );
    });

    it("should preserve case (unlike normalizeAnswer)", () => {
      expect(normalizeAnswerOnSave("The Industrial Revolution")).toBe(
        "The Industrial Revolution",
      );
    });

    it("should handle empty string", () => {
      expect(normalizeAnswerOnSave("")).toBe("");
    });

    it("should handle tab characters", () => {
      expect(normalizeAnswerOnSave("hello\tworld")).toBe("hello world");
    });

    it("should handle non-breaking spaces (U+00A0)", () => {
      expect(normalizeAnswerOnSave("hello\u00A0world")).toBe("hello world");
    });
  });

  // --- Story 3.5 Task 6: normalizeCorrectAnswer ---
  describe("normalizeCorrectAnswer", () => {
    it("should normalize TextAnswer (R5/R6/R8) format", () => {
      const input = { answer: "  carbon   dioxide  ", acceptedVariants: ["  CO2  ", "  co2  "], strictWordOrder: true };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({ answer: "carbon dioxide", acceptedVariants: ["CO2", "co2"], strictWordOrder: true });
    });

    it("should normalize NTF structured blanks (R13) format", () => {
      const input = {
        blanks: {
          "1": { answer: "  fifteen   percent  ", acceptedVariants: ["  15%  "], strictWordOrder: true },
        },
      };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({
        blanks: {
          "1": { answer: "fifteen percent", acceptedVariants: ["15%"], strictWordOrder: true },
        },
      });
    });

    it("should normalize DiagramLabelling union format (R14)", () => {
      const input = {
        labels: {
          "0": "  word bank answer  ",
          "1": { answer: "  free text  ", acceptedVariants: ["  alt  "], strictWordOrder: false },
        },
      };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({
        labels: {
          "0": "word bank answer",
          "1": { answer: "free text", acceptedVariants: ["alt"], strictWordOrder: false },
        },
      });
    });

    it("should normalize WordBank blanks (R7) format", () => {
      const input = { blanks: { "1": "  carbon  ", "2": "  dioxide  " } };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({ blanks: { "1": "carbon", "2": "dioxide" } });
    });

    it("should normalize Matching matches (R9-R12) format", () => {
      const input = { matches: { "A": "  paragraph   1  ", "B": "  paragraph   2  " } };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({ matches: { "A": "paragraph 1", "B": "paragraph 2" } });
    });

    it("should normalize TFNG answer (R3/R4) format", () => {
      const input = { answer: "TRUE" };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({ answer: "TRUE" });
    });

    it("should normalize MCQ answer format", () => {
      const input = { answer: "  A  " };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({ answer: "A" });
    });

    it("should normalize MCQ Multi answers array (R2)", () => {
      const input = { answers: ["  A  ", "  C  "] };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({ answers: ["A", "C"] });
    });

    it("should handle null input", () => {
      expect(normalizeCorrectAnswer(null)).toBeNull();
    });

    it("should handle undefined input", () => {
      expect(normalizeCorrectAnswer(undefined)).toBeUndefined();
    });

    it("should normalize deeply nested NTF with variants (save-time integration)", () => {
      // Simulates what sections.service.ts passes: the full correctAnswer JSON
      const input = {
        blanks: {
          "1": {
            answer: "  carbon   dioxide  ",
            acceptedVariants: ["  CO2  ", "  Carbon Dioxide  "],
            strictWordOrder: true,
          },
          "2": {
            answer: "  renewable   energy  ",
            acceptedVariants: [],
            strictWordOrder: false,
          },
        },
      };
      const result = normalizeCorrectAnswer(input);
      expect(result).toEqual({
        blanks: {
          "1": {
            answer: "carbon dioxide",
            acceptedVariants: ["CO2", "Carbon Dioxide"],
            strictWordOrder: true,
          },
          "2": {
            answer: "renewable energy",
            acceptedVariants: [],
            strictWordOrder: false,
          },
        },
      });
    });
  });
});
