import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { gradingKeys } from "./grading-keys";

export function useTeacherComments(submissionId: string) {
  return useQuery({
    queryKey: gradingKeys.comments(submissionId),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/grading/submissions/{submissionId}/comments",
        {
          params: { path: { submissionId } },
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: !!submissionId,
    staleTime: 30_000,
  });
}
