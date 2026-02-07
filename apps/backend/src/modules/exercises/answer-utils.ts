/**
 * Answer normalization and matching utilities for IELTS question types.
 * Used by R5 (Sentence Completion), R6 (Short Answer), R8 (Summary Passage).
 */

/** Trims, lowercases, and collapses whitespace in answer text. */
export function normalizeAnswer(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Checks if a student answer matches the correct answer or any accepted variant.
 * Normalization (trim + collapse whitespace) is always applied.
 * Case comparison depends on the caseSensitive flag.
 */
export function matchesAnswer(
  studentAnswer: string,
  correctAnswer: string,
  variants: string[],
  caseSensitive: boolean,
): boolean {
  const normalize = (s: string): string => {
    const trimmed = s.trim().replace(/\s+/g, " ");
    return caseSensitive ? trimmed : trimmed.toLowerCase();
  };

  const normalizedStudent = normalize(studentAnswer);
  const candidates = [correctAnswer, ...variants];

  return candidates.some(
    (candidate) => normalize(candidate) === normalizedStudent,
  );
}

/** Checks if text is within the specified word limit. */
export function checkWordLimit(text: string, limit: number): boolean {
  const trimmed = text.trim();
  if (trimmed === "") return true;
  const words = trimmed.replace(/\s+/g, " ").split(" ");
  return words.length <= limit;
}
