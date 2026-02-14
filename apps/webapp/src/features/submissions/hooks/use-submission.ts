import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { submissionKeys } from "./submission-keys";

export function useSubmission(submissionId: string | null | undefined) {
  return useQuery({
    queryKey: submissionKeys.detail(submissionId ?? ""),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student/submissions/{id}",
        {
          params: { path: { id: submissionId! } },
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: !!submissionId,
  });
}
