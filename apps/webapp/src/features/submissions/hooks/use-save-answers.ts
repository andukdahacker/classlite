import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionKeys } from "./submission-keys";

export function useSaveAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    networkMode: "offlineFirst",
    mutationFn: async ({
      submissionId,
      answers,
    }: {
      submissionId: string;
      answers: { questionId: string; answer?: unknown }[];
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/student/submissions/{id}/answers",
        {
          params: { path: { id: submissionId } },
          body: { answers },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: submissionKeys.detail(variables.submissionId),
      });
    },
  });
}
