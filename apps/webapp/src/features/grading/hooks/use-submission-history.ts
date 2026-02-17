import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { gradingKeys } from "./grading-keys";

async function fetchSubmissionHistory(submissionId: string) {
  const { data, error } = await client.GET(
    "/api/v1/grading/student/submissions/{submissionId}/history",
    {
      params: { path: { submissionId } },
    },
  );
  if (error) throw error;
  return data;
}

export function useSubmissionHistory(submissionId: string | null | undefined) {
  return useQuery({
    queryKey: gradingKeys.submissionHistory(submissionId ?? ""),
    queryFn: () => fetchSubmissionHistory(submissionId!),
    enabled: !!submissionId,
    staleTime: 60_000,
  });
}
