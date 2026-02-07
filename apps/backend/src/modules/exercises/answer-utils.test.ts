import { describe, it, expect } from "vitest";
import { normalizeAnswer, matchesAnswer, checkWordLimit } from "./answer-utils.js";

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
});
