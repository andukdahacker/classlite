// IELTS Listening Band Conversion (same for Academic & General Training)
export const LISTENING_BAND_TABLE: Array<{
  min: number;
  max: number;
  band: number;
}> = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 16, max: 18, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 2, max: 3, band: 2.0 },
  { min: 0, max: 1, band: 1.0 },
];

// IELTS Academic Reading Band Conversion
export const READING_ACADEMIC_BAND_TABLE: Array<{
  min: number;
  max: number;
  band: number;
}> = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 2, max: 3, band: 2.0 },
  { min: 0, max: 1, band: 1.0 },
];

// IELTS General Training Reading Band Conversion (higher thresholds)
export const READING_GENERAL_BAND_TABLE: Array<{
  min: number;
  max: number;
  band: number;
}> = [
  { min: 40, max: 40, band: 9.0 },
  { min: 39, max: 39, band: 8.5 },
  { min: 37, max: 38, band: 8.0 },
  { min: 36, max: 36, band: 7.5 },
  { min: 34, max: 35, band: 7.0 },
  { min: 32, max: 33, band: 6.5 },
  { min: 30, max: 31, band: 6.0 },
  { min: 27, max: 29, band: 5.5 },
  { min: 23, max: 26, band: 5.0 },
  { min: 19, max: 22, band: 4.5 },
  { min: 15, max: 18, band: 4.0 },
  { min: 12, max: 14, band: 3.5 },
  { min: 9, max: 11, band: 3.0 },
  { min: 6, max: 8, band: 2.5 },
  { min: 4, max: 5, band: 2.0 },
  { min: 0, max: 3, band: 1.0 },
];

// Writing criteria names (for reference/display)
export const WRITING_CRITERIA = [
  "Task Achievement",
  "Coherence & Cohesion",
  "Lexical Resource",
  "Grammatical Range & Accuracy",
] as const;

// Speaking criteria names (for reference/display)
export const SPEAKING_CRITERIA = [
  "Fluency & Coherence",
  "Lexical Resource",
  "Grammatical Range & Accuracy",
  "Pronunciation",
] as const;

/** Convert raw score to band using conversion table */
export function rawScoreToBand(
  rawScore: number,
  table: Array<{ min: number; max: number; band: number }>,
): number {
  const clamped = Math.max(0, Math.min(40, Math.round(rawScore)));
  const entry = table.find((e) => clamped >= e.min && clamped <= e.max);
  return entry?.band ?? 1.0;
}

/** Round to nearest 0.5 (IELTS rounding: .25/.75 round UP) */
export function roundToHalfBand(score: number): number {
  return Math.round(score * 2) / 2;
}

/** Calculate Writing band: Task 2 has double weight */
export function calculateWritingBand(
  task1CriteriaScores: number[],
  task2CriteriaScores: number[],
): number {
  if (task1CriteriaScores.length === 0 || task2CriteriaScores.length === 0) {
    return 0;
  }
  const task1Band = roundToHalfBand(
    task1CriteriaScores.reduce((a, b) => a + b, 0) /
      task1CriteriaScores.length,
  );
  const task2Band = roundToHalfBand(
    task2CriteriaScores.reduce((a, b) => a + b, 0) /
      task2CriteriaScores.length,
  );
  // Task 2 = double weight: (T1 + T2*2) / 3
  return roundToHalfBand((task1Band + task2Band * 2) / 3);
}

/** Calculate Speaking band: average of 4 criteria */
export function calculateSpeakingBand(criteriaScores: number[]): number {
  if (criteriaScores.length === 0) return 0;
  return roundToHalfBand(
    criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length,
  );
}

/** Calculate overall IELTS band from 4 skill scores */
export function calculateOverallBand(skillBands: number[]): number {
  if (skillBands.length === 0) return 0;
  const avg = skillBands.reduce((a, b) => a + b, 0) / skillBands.length;
  return roundToHalfBand(avg);
}
