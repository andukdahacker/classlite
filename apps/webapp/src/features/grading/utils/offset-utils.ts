/**
 * Shared offset calculation utilities for mapping global feedback offsets
 * to per-answer local offsets. Used by both the teacher grading workbench
 * (StudentWorkPane) and the student feedback view (StudentFeedbackContent).
 */

export const ANSWER_SEPARATOR = "\n\n";

export interface AnswerRange {
  globalStart: number;
  globalEnd: number;
}

/**
 * Compute the global character ranges for each answer text,
 * accounting for the separator between concatenated answers.
 */
export function computeAnswerRanges(answerTexts: string[]): AnswerRange[] {
  const ranges: AnswerRange[] = [];
  let offset = 0;
  for (const text of answerTexts) {
    ranges.push({ globalStart: offset, globalEnd: offset + text.length });
    offset += text.length + ANSWER_SEPARATOR.length;
  }
  return ranges;
}

/**
 * Find which answer index a global offset range belongs to.
 * Returns -1 if the range spans answer boundaries.
 */
export function findAnswerIndex(
  startOffset: number,
  endOffset: number,
  answerRanges: AnswerRange[],
): number {
  for (let i = 0; i < answerRanges.length; i++) {
    const range = answerRanges[i];
    if (startOffset >= range.globalStart && endOffset <= range.globalEnd) {
      return i;
    }
  }
  return -1;
}
