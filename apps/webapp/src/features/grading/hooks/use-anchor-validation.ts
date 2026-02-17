export type AnchorStatus = "valid" | "drifted" | "orphaned" | "no-anchor";

interface AnchorValidationResult {
  anchorStatus: AnchorStatus;
  textAtOffset: string | null;
}

/**
 * Levenshtein distance using single-row DP (O(n*m) time, O(min(n,m)) space).
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure 'a' is the shorter string for O(min(n,m)) space
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const aLen = a.length;
  const bLen = b.length;
  const row = new Array<number>(aLen + 1);

  for (let i = 0; i <= aLen; i++) {
    row[i] = i;
  }

  for (let j = 1; j <= bLen; j++) {
    let prev = row[0];
    row[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = row[i];
      row[i] = Math.min(
        row[i] + 1,       // deletion
        row[i - 1] + 1,   // insertion
        prev + cost,       // substitution
      );
      prev = temp;
    }
  }

  return row[aLen];
}

/**
 * Calculate similarity ratio between two strings using Levenshtein distance.
 * Returns value between 0 (completely different) and 1 (identical).
 */
export function calculateSimilarity(a: string, b: string): number {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();

  if (normA.length === 0 && normB.length === 0) return 1;
  if (normA.length === 0 || normB.length === 0) return 0;

  const maxLen = Math.max(normA.length, normB.length);
  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

/**
 * Validate whether a feedback item's text anchor is still valid given the current student text.
 */
export function validateAnchor(
  startOffset: number | null | undefined,
  endOffset: number | null | undefined,
  originalContextSnippet: string | null | undefined,
  studentText: string,
): AnchorValidationResult {
  // No anchor data available
  if (startOffset == null || endOffset == null) {
    return { anchorStatus: "no-anchor", textAtOffset: null };
  }

  // Extract current text at the offset positions
  const currentText = studentText.slice(startOffset, endOffset);

  // If no original snippet to compare, trust the offsets
  if (originalContextSnippet == null) {
    return { anchorStatus: "valid", textAtOffset: currentText };
  }

  // Compare current text to original snippet
  const similarity = calculateSimilarity(currentText, originalContextSnippet);

  if (similarity >= 0.8) {
    return { anchorStatus: "valid", textAtOffset: currentText };
  }
  if (similarity >= 0.5) {
    return { anchorStatus: "drifted", textAtOffset: currentText };
  }
  return { anchorStatus: "orphaned", textAtOffset: currentText };
}

