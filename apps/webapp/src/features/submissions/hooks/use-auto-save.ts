import { useEffect, useRef, useState, useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveAnswersLocal, clearAnswersLocal, isStorageAvailable } from "../lib/submission-storage";
import { useSaveAnswers } from "./use-save-answers";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline" | "syncing";

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
  isOnline: boolean;
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
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  const storageCheckedRef = useRef(false);
  const storageAvailableRef = useRef(true);
  const toastShownRef = useRef(false);
  const lastSavedAnswersRef = useRef<string>("");
  const lastServerSavedAnswersRef = useRef<string>("");
  const lastServerSaveTimestamp = useRef<number>(0);
  const serverDebounceTimerRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const { mutate: saveAnswersMutate } = useSaveAnswers();

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

      saveAnswersMutate(
        { submissionId, answers: changedAnswers },
        {
          onSuccess: () => {
            lastServerSaveTimestamp.current = Date.now();
            lastServerSavedAnswersRef.current = JSON.stringify(answersRef.current);
          },
        },
      );
    },
    [submissionId, saveAnswersMutate],
  );

  // Network status subscription via onlineManager
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);

      if (!online) {
        setSaveStatus("offline");
      } else {
        // Coming back online — check for pending server changes
        const lastServerSnapshot = lastServerSavedAnswersRef.current;

        if (submissionId) {
          // Build changed answers list for server sync
          let lastServerAnswers: Record<string, unknown> = {};
          try {
            lastServerAnswers = lastServerSnapshot
              ? (JSON.parse(lastServerSnapshot) as Record<string, unknown>)
              : {};
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
            setSaveStatus("syncing");
            saveAnswersMutate(
              { submissionId, answers: changed },
              {
                onSuccess: () => {
                  lastServerSaveTimestamp.current = Date.now();
                  lastServerSavedAnswersRef.current = JSON.stringify(answersRef.current);
                  setSaveStatus("saved");
                  toast.success("Changes synced");
                },
                onError: () => {
                  setSaveStatus("error");
                  toast.error("Failed to sync changes — please check your connection");
                },
              },
            );
          } else {
            // No actual data changes — restore to idle
            setSaveStatus("idle");
          }
        } else {
          // No submission — just restore to idle
          setSaveStatus("idle");
        }
      }
    });
    return unsubscribe;
  }, [submissionId, saveAnswersMutate]);

  // Main auto-save interval
  useEffect(() => {
    if (!enabled || !centerId || !assignmentId) return;

    const interval = window.setInterval(() => {
      const currentSnapshot = JSON.stringify(answersRef.current);

      // Skip if nothing changed since last local save
      if (currentSnapshot === lastSavedAnswersRef.current) return;

      // Don't override offline status with saving — IndexedDB save still happens
      if (onlineManager.isOnline()) {
        setSaveStatus("saving");
      }

      // Save to IndexedDB (if available) — continues regardless of network
      if (storageAvailableRef.current) {
        saveAnswersLocal(centerId, assignmentId, submissionId, answersRef.current)
          .then(() => {
            lastSavedAnswersRef.current = currentSnapshot;
            const now = Date.now();
            setLastSavedAt(now);
            // Only set "saved" if we're online; if offline, keep "offline" status
            if (onlineManager.isOnline()) {
              setSaveStatus("saved");
            }
          })
          .catch(() => {
            setSaveStatus("error");
          });
      } else {
        // Storage not available — mark as saved anyway (server will handle it)
        lastSavedAnswersRef.current = currentSnapshot;
        if (onlineManager.isOnline()) {
          setSaveStatus("saved");
        }
      }

      // Debounced server save — skip if offline (mutations will queue via networkMode)
      if (!onlineManager.isOnline()) return;

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
    isOnline,
  };
}
