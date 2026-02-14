import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { saveAnswersLocal, clearAnswersLocal, isStorageAvailable } from "../lib/submission-storage";
import { useSaveAnswers } from "./use-save-answers";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  centerId: string | undefined;
  assignmentId: string | undefined;
  submissionId: string | null;
  answers: Record<string, unknown>;
  enabled: boolean;
  intervalMs?: number;
  serverDebounceMs?: number;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  lastServerSaveTimestamp: React.RefObject<number>;
  clearLocal: () => Promise<void>;
  storageAvailable: boolean;
}

export function useAutoSave({
  centerId,
  assignmentId,
  submissionId,
  answers,
  enabled,
  intervalMs = 3000,
  serverDebounceMs = 500,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const storageCheckedRef = useRef(false);
  const storageAvailableRef = useRef(true);
  const toastShownRef = useRef(false);
  const lastSavedAnswersRef = useRef<string>("");
  const lastServerSavedAnswersRef = useRef<string>("");
  const lastServerSaveTimestamp = useRef<number>(0);
  const serverDebounceTimerRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const saveAnswersMutation = useSaveAnswers();

  // Check storage availability once on mount
  useEffect(() => {
    if (storageCheckedRef.current) return;
    storageCheckedRef.current = true;

    isStorageAvailable().then((available) => {
      storageAvailableRef.current = available;
      setStorageAvailable(available);
      if (!available && !toastShownRef.current) {
        toastShownRef.current = true;
        toast.error("Auto-save unavailable \u2014 your work is only saved to the server");
      }
    });
  }, []);

  // Server save helper
  const saveToServer = useCallback(
    (changedAnswers: { questionId: string; answer: unknown }[]) => {
      if (!submissionId || changedAnswers.length === 0) return;

      saveAnswersMutation.mutate(
        { submissionId, answers: changedAnswers },
        {
          onSuccess: () => {
            lastServerSaveTimestamp.current = Date.now();
            lastServerSavedAnswersRef.current = JSON.stringify(answersRef.current);
          },
        },
      );
    },
    [submissionId, saveAnswersMutation],
  );

  // Main auto-save interval
  useEffect(() => {
    if (!enabled || !centerId || !assignmentId) return;

    const interval = window.setInterval(() => {
      const currentSnapshot = JSON.stringify(answersRef.current);

      // Skip if nothing changed since last local save
      if (currentSnapshot === lastSavedAnswersRef.current) return;

      setSaveStatus("saving");

      // Save to IndexedDB (if available)
      if (storageAvailableRef.current) {
        saveAnswersLocal(centerId, assignmentId, submissionId, answersRef.current)
          .then(() => {
            lastSavedAnswersRef.current = currentSnapshot;
            const now = Date.now();
            setLastSavedAt(now);
            setSaveStatus("saved");
          })
          .catch(() => {
            setSaveStatus("error");
          });
      } else {
        // Storage not available — mark as saved anyway (server will handle it)
        lastSavedAnswersRef.current = currentSnapshot;
        setSaveStatus("saved");
      }

      // Debounced server save — only send changed questionIds
      if (serverDebounceTimerRef.current !== null) {
        window.clearTimeout(serverDebounceTimerRef.current);
      }

      serverDebounceTimerRef.current = window.setTimeout(() => {
        serverDebounceTimerRef.current = null;

        const lastServerSnapshot = lastServerSavedAnswersRef.current;
        let lastServerAnswers: Record<string, unknown> = {};
        try {
          lastServerAnswers = lastServerSnapshot ? (JSON.parse(lastServerSnapshot) as Record<string, unknown>) : {};
        } catch {
          lastServerAnswers = {};
        }

        const currentAnswers = answersRef.current;
        const changed: { questionId: string; answer: unknown }[] = [];

        for (const [questionId, answer] of Object.entries(currentAnswers)) {
          if (JSON.stringify(answer) !== JSON.stringify(lastServerAnswers[questionId])) {
            changed.push({ questionId, answer });
          }
        }

        if (changed.length > 0) {
          saveToServer(changed);
        }
      }, serverDebounceMs);
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
      if (serverDebounceTimerRef.current !== null) {
        window.clearTimeout(serverDebounceTimerRef.current);
        serverDebounceTimerRef.current = null;
      }
    };
  }, [enabled, centerId, assignmentId, submissionId, intervalMs, serverDebounceMs, saveToServer]);

  const clearLocal = useCallback(async () => {
    if (centerId && assignmentId) {
      await clearAnswersLocal(centerId, assignmentId);
    }
  }, [centerId, assignmentId]);

  return {
    saveStatus,
    lastSavedAt,
    lastServerSaveTimestamp,
    clearLocal,
    storageAvailable,
  };
}
