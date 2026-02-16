import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { gradingKeys } from "./grading-keys";
import { fetchSubmissionDetail } from "./use-submission-detail";

export function usePrefetchSubmission(nextSubmissionId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (nextSubmissionId) {
      queryClient.prefetchQuery({
        queryKey: gradingKeys.detail(nextSubmissionId),
        queryFn: () => fetchSubmissionDetail(nextSubmissionId),
        staleTime: 30_000,
      });
    }
  }, [nextSubmissionId, queryClient]);
}
