import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

export function useRetriggerAnalysis(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await client.POST(
        "/api/v1/grading/submissions/{submissionId}/analyze",
        {
          params: { path: { submissionId } },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
      toast.success("AI re-analysis triggered");
    },
    onError: () => {
      toast.error("Failed to trigger AI analysis. Please try again.");
    },
  });
}
