import client from "@/core/client";
import { useMutation } from "@tanstack/react-query";
import type { ConflictCheckInput, ConflictResult } from "@workspace/types";
import { useDebouncedCallback } from "use-debounce";
import { useCallback, useState } from "react";

/**
 * Hook for checking scheduling conflicts (room and teacher double-booking)
 * Provides both immediate and debounced conflict checking
 */
export const useConflictCheck = () => {
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(
    null,
  );

  const checkConflictsMutation = useMutation({
    mutationFn: async (input: ConflictCheckInput) => {
      const { data, error } = await client.POST(
        "/api/v1/logistics/sessions/check-conflicts",
        {
          body: {
            ...input,
            startTime:
              typeof input.startTime === "string"
                ? input.startTime
                : input.startTime.toISOString(),
            endTime:
              typeof input.endTime === "string"
                ? input.endTime
                : input.endTime.toISOString(),
          },
        },
      );
      if (error) throw error;
      if (!data?.data) throw new Error("Empty conflict check response");
      return data.data as ConflictResult;
    },
    onSuccess: (result) => {
      setConflictResult(result);
    },
  });

  // Debounced version for real-time form validation (300ms delay)
  const debouncedCheckConflicts = useDebouncedCallback(
    (input: ConflictCheckInput) => {
      checkConflictsMutation.mutate(input);
    },
    300,
  );

  // Clear conflict state
  const clearConflicts = useCallback(() => {
    setConflictResult(null);
  }, []);

  // Immediate check (for final validation before submit)
  // Note: not wrapped in useCallback — mutateAsync is stable per useMutation
  const checkConflictsImmediate = async (input: ConflictCheckInput) => {
    return checkConflictsMutation.mutateAsync(input);
  };

  return {
    // Conflict result state
    conflictResult,
    hasConflicts: conflictResult?.hasConflicts ?? false,
    roomConflicts: conflictResult?.roomConflicts ?? [],
    teacherConflicts: conflictResult?.teacherConflicts ?? [],
    suggestions: conflictResult?.suggestions ?? [],

    // Actions
    checkConflicts: debouncedCheckConflicts,
    checkConflictsImmediate,
    clearConflicts,

    // Loading states
    isChecking: checkConflictsMutation.isPending,
    checkError: checkConflictsMutation.error,
  };
};
