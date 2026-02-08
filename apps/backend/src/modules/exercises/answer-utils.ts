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
  strictWordOrder: boolean = true,
): boolean {
  const normalize = (s: string): string => {
    const trimmed = s.trim().replace(/\s+/g, " ");
    return caseSensitive ? trimmed : trimmed.toLowerCase();
  };

  const normalizedStudent = normalize(studentAnswer);
  const candidates = [correctAnswer, ...variants];

  if (strictWordOrder) {
    return candidates.some(
      (candidate) => normalize(candidate) === normalizedStudent,
    );
  }

  // Word-order-independent matching: split into sorted word arrays and compare.
  // Suitable for IELTS answers which are short English phrases (1-5 words from passage).
  // Vietnamese compound words like "thành phố" split into separate tokens — acceptable
  // for IELTS Reading answers extracted verbatim from English passages.
  // Uses sorted arrays (not Sets) to correctly handle duplicate words in answers.
  const studentWordsSorted = normalizedStudent.split(/\s+/).filter(w => w.length > 0).sort();
  return candidates.some((candidate) => {
    const candidateWordsSorted = normalize(candidate).split(/\s+/).filter(w => w.length > 0).sort();
    if (candidateWordsSorted.length === 0 && studentWordsSorted.length === 0) return true;
    if (candidateWordsSorted.length !== studentWordsSorted.length) return false;
    return candidateWordsSorted.every((w, i) => w === studentWordsSorted[i]);
  });
}

/**
 * Migrates R13 (NoteTableFlowchart) answer from flat format to structured variant-aware format.
 * Old format: { blanks: { "1": "answer text" } }
 * New format: { blanks: { "1": { answer: "answer text", acceptedVariants: [], strictWordOrder: true } } }
 * If already in structured format, returns as-is.
 */
export function migrateNtfAnswer(
  answer: Record<string, unknown>,
): Record<string, { answer: string; acceptedVariants: string[]; strictWordOrder: boolean }> {
  const result: Record<string, { answer: string; acceptedVariants: string[]; strictWordOrder: boolean }> = {};
  for (const [key, value] of Object.entries(answer)) {
    if (typeof value === "string") {
      result[key] = { answer: value, acceptedVariants: [], strictWordOrder: true };
    } else if (typeof value === "object" && value !== null && "answer" in value) {
      const obj = value as { answer: string; acceptedVariants?: string[]; strictWordOrder?: boolean };
      result[key] = {
        answer: obj.answer,
        acceptedVariants: obj.acceptedVariants ?? [],
        strictWordOrder: obj.strictWordOrder ?? true,
      };
    }
  }
  return result;
}

/**
 * Scores exact-match mapping for matching types (R9-R12).
 * Compares student matches against correct matches, returning correct count, total, and score.
 * Used by the grading engine (Epic 5) for partial credit calculation.
 */
export function matchesExactMapping(
  studentMatches: Record<string, string>,
  correctMatches: Record<string, string>,
): { correct: number; total: number; score: number } {
  const total = Object.keys(correctMatches).length;
  let correct = 0;
  for (const [key, value] of Object.entries(correctMatches)) {
    if (studentMatches[key] === value) correct++;
  }
  return { correct, total, score: total > 0 ? correct / total : 0 };
}

/**
 * Normalizes answer text for storage. Trims and collapses whitespace but preserves case.
 * Used at save-time to clean stored answers without destroying case information.
 * Unlike normalizeAnswer() which lowercases for match-time comparison,
 * this preserves the teacher's original casing for caseSensitive matching.
 */
export function normalizeAnswerOnSave(text: string): string {
  return text.trim().replace(/[\s\u00A0]+/g, " ");
}

/**
 * Recursively normalizes string answer values within correctAnswer JSON.
 * Handles all question type formats: TextAnswer, NTF blanks, DiagramLabelling labels,
 * WordBank blanks, Matching matches, TFNG/MCQ answers.
 */
export function normalizeCorrectAnswer(answer: unknown): unknown {
  if (answer === null) return null;
  if (answer === undefined) return undefined;
  if (typeof answer !== "object") return answer;

  const obj = answer as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === "answer" && typeof value === "string") {
      result[key] = normalizeAnswerOnSave(value);
    } else if (key === "acceptedVariants" && Array.isArray(value)) {
      result[key] = value.map((v: unknown) => typeof v === "string" ? normalizeAnswerOnSave(v) : v);
    } else if (key === "answers" && Array.isArray(value)) {
      result[key] = value.map((v: unknown) => typeof v === "string" ? normalizeAnswerOnSave(v) : v);
    } else if ((key === "blanks" || key === "labels" || key === "matches") && typeof value === "object" && value !== null) {
      const record = value as Record<string, unknown>;
      const normalizedRecord: Record<string, unknown> = {};
      for (const [rKey, rValue] of Object.entries(record)) {
        if (typeof rValue === "string") {
          normalizedRecord[rKey] = normalizeAnswerOnSave(rValue);
        } else if (typeof rValue === "object" && rValue !== null) {
          normalizedRecord[rKey] = normalizeCorrectAnswer(rValue);
        } else {
          normalizedRecord[rKey] = rValue;
        }
      }
      result[key] = normalizedRecord;
    } else {
      result[key] = value;
    }
  }

  return result;
}

/** Checks if text is within the specified word limit. */
export function checkWordLimit(text: string, limit: number): boolean {
  const trimmed = text.trim();
  if (trimmed === "") return true;
  const words = trimmed.replace(/\s+/g, " ").split(" ");
  return words.length <= limit;
}
