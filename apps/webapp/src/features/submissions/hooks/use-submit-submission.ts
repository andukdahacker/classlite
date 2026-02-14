import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionKeys } from "./submission-keys";

export function useSubmitSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      timeSpentSec,
    }: {
      submissionId: string;
      timeSpentSec?: number;
    }) => {
      const { data, error } = await client.POST(
        "/api/v1/student/submissions/{id}/submit",
        {
          params: { path: { id: submissionId } },
          body: { timeSpentSec },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
