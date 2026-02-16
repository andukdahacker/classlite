import client from "@/core/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gradingKeys } from "./grading-keys";

async function fetchSubmissionDetail(submissionId: string) {
  const { data, error } = await client.GET(
    "/api/v1/grading/submissions/{submissionId}",
    {
      params: { path: { submissionId } },
    },
  );
  if (error) throw error;
  return data;
}

export function useSubmissionDetail(submissionId: string | null | undefined) {
  const queryClient = useQueryClient();

  const cachedData = submissionId
    ? queryClient.getQueryData(gradingKeys.detail(submissionId))
    : undefined;

  return useQuery({
    queryKey: gradingKeys.detail(submissionId ?? ""),
    queryFn: () => fetchSubmissionDetail(submissionId!),
    enabled: !!submissionId,
    initialData: cachedData as Awaited<
      ReturnType<typeof fetchSubmissionDetail>
    >,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.analysisStatus;
      return status === "analyzing" ? 5000 : false;
    },
  });
}

export { fetchSubmissionDetail };
