import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionKeys } from "./submission-keys";

export function useStartSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await client.POST("/api/v1/student/submissions/", {
        body: { assignmentId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
