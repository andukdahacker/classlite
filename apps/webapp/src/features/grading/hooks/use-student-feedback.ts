import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { gradingKeys } from "./grading-keys";

async function fetchStudentFeedback(submissionId: string) {
  const { data, error } = await client.GET(
    "/api/v1/grading/student/submissions/{submissionId}",
    {
      params: { path: { submissionId } },
    },
  );
  if (error) throw error;
  return data;
}

export function useStudentFeedback(submissionId: string | null | undefined) {
  return useQuery({
    queryKey: gradingKeys.studentFeedback(submissionId ?? ""),
    queryFn: () => fetchStudentFeedback(submissionId!),
    enabled: !!submissionId,
    staleTime: 60_000,
  });
}
