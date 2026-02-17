import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

interface FinalizeGradingInput {
  teacherFinalScore?: number | null;
  teacherCriteriaScores?: Record<string, number> | null;
  teacherGeneralFeedback?: string | null;
}

export function useFinalizeGrading(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: FinalizeGradingInput) => {
      const { data, error } = await client.POST(
        "/api/v1/grading/submissions/{submissionId}/finalize",
        {
          params: { path: { submissionId } },
          body,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
      queryClient.invalidateQueries({
        queryKey: gradingKeys.queue({}),
      });
    },
    onError: () => {
      toast.error("Failed to finalize grading");
    },
  });
}
