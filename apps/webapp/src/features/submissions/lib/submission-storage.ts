import { get, set, del } from "idb-keyval";

const PREFIX = "classlite:answers:";

export function getStorageKey(centerId: string, assignmentId: string): string {
  return `${PREFIX}${centerId}:${assignmentId}`;
}

export interface StoredAnswers {
  centerId: string;
  assignmentId: string;
  submissionId: string | null;
  answers: Record<string, unknown>;
  savedAt: number;
}

/**
 * Probe IndexedDB availability. Returns false in private browsing,
 * when quota is exceeded, or when IndexedDB is blocked by browser policy.
 * Call once on mount — cache the result for the session.
 */
export async function isStorageAvailable(): Promise<boolean> {
  try {
    const testKey = "__classlite_probe__";
    await set(testKey, 1);
    await del(testKey);
    return true;
  } catch {
    return false;
  }
}

export async function saveAnswersLocal(
  centerId: string,
  assignmentId: string,
  submissionId: string | null,
  answers: Record<string, unknown>,
): Promise<void> {
  const key = getStorageKey(centerId, assignmentId);
  const data: StoredAnswers = { centerId, assignmentId, submissionId, answers, savedAt: Date.now() };
  await set(key, data);
}

export async function loadAnswersLocal(
  centerId: string,
  assignmentId: string,
): Promise<StoredAnswers | undefined> {
  const key = getStorageKey(centerId, assignmentId);
  return get<StoredAnswers>(key);
}

export async function clearAnswersLocal(
  centerId: string,
  assignmentId: string,
): Promise<void> {
  const key = getStorageKey(centerId, assignmentId);
  await del(key);
}
