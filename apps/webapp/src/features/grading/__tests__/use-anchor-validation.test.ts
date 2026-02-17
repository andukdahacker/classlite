import { describe, it, expect } from "vitest";
import {
  calculateSimilarity,
  validateAnchor,
} from "../hooks/use-anchor-validation";

describe("calculateSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(calculateSimilarity("hello world", "hello world")).toBe(1);
  });

  it("returns 0 for empty vs non-empty string", () => {
    expect(calculateSimilarity("", "hello")).toBe(0);
  });

  it("returns 1 for two empty strings", () => {
    expect(calculateSimilarity("", "")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    const sim = calculateSimilarity("abcdef", "zyxwvu");
    expect(sim).toBeLessThan(0.5);
  });

  it("handles partial overlap", () => {
    const sim = calculateSimilarity("hello world", "hello earth");
    expect(sim).toBeGreaterThan(0.5);
    expect(sim).toBeLessThan(1);
  });

  it("handles single character difference", () => {
    const sim = calculateSimilarity("cat", "bat");
    expect(sim).toBeCloseTo(0.667, 2);
  });

  it("is case insensitive", () => {
    expect(calculateSimilarity("Hello", "hello")).toBe(1);
  });

  it("trims whitespace", () => {
    expect(calculateSimilarity("  hello  ", "hello")).toBe(1);
  });

  it("handles single character strings", () => {
    expect(calculateSimilarity("a", "a")).toBe(1);
    expect(calculateSimilarity("a", "b")).toBe(0);
  });

  it("handles long similar strings", () => {
    const a = "The quick brown fox jumps over the lazy dog";
    const b = "The quick brown fox jumped over the lazy dog";
    const sim = calculateSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.9);
  });
});

describe("validateAnchor", () => {
  const studentText = "The student wrote this essay about climate change.";

  it("returns no-anchor when startOffset is null", () => {
    const result = validateAnchor(null, 10, "student", studentText);
    expect(result.anchorStatus).toBe("no-anchor");
    expect(result.textAtOffset).toBeNull();
  });

  it("returns no-anchor when endOffset is null", () => {
    const result = validateAnchor(0, null, "student", studentText);
    expect(result.anchorStatus).toBe("no-anchor");
    expect(result.textAtOffset).toBeNull();
  });

  it("returns no-anchor when both offsets are undefined", () => {
    const result = validateAnchor(undefined, undefined, "student", studentText);
    expect(result.anchorStatus).toBe("no-anchor");
    expect(result.textAtOffset).toBeNull();
  });

  it("returns valid when text matches exactly", () => {
    const snippet = "student wrote";
    const start = studentText.indexOf(snippet);
    const end = start + snippet.length;
    const result = validateAnchor(start, end, snippet, studentText);
    expect(result.anchorStatus).toBe("valid");
    expect(result.textAtOffset).toBe(snippet);
  });

  it("returns valid when similarity >= 80%", () => {
    // Original snippet was "student wrote" but text has minor change
    const snippet = "student wrota"; // 1 char diff in 13 chars ~ 92% similar
    const start = 4; // "student wrote" starts at index 4
    const end = 17;
    const result = validateAnchor(start, end, snippet, studentText);
    expect(result.anchorStatus).toBe("valid");
  });

  it("returns drifted when similarity is 50-80%", () => {
    // "student wrote" at offsets 4-17. Snippet "studxnt xrotx" has 3 char diffs
    // in 13 chars → distance 3, similarity = 1 - 3/13 ≈ 0.769 → drifted (50-80%)
    const start = 4;
    const end = 17;
    const snippet = "studxnt xrotx";
    const result = validateAnchor(start, end, snippet, studentText);
    expect(result.anchorStatus).toBe("drifted");
  });

  it("returns orphaned when similarity < 50%", () => {
    const start = 0;
    const end = 10;
    const snippet = "completely different text that is nothing like original";
    const result = validateAnchor(start, end, snippet, studentText);
    expect(result.anchorStatus).toBe("orphaned");
  });

  it("returns valid with null originalContextSnippet and valid offsets", () => {
    const result = validateAnchor(0, 10, null, studentText);
    expect(result.anchorStatus).toBe("valid");
    expect(result.textAtOffset).toBe("The studen");
  });

  it("returns textAtOffset from current text", () => {
    const result = validateAnchor(0, 3, "The", studentText);
    expect(result.textAtOffset).toBe("The");
  });

  it("handles offsets at end of text", () => {
    const text = "short";
    const result = validateAnchor(0, 5, "short", text);
    expect(result.anchorStatus).toBe("valid");
    expect(result.textAtOffset).toBe("short");
  });
});
