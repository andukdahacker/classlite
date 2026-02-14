import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { submissionKeys } from "./submission-keys";

export function useAssignmentDetail(assignmentId: string | null | undefined) {
  return useQuery({
    queryKey: submissionKeys.byAssignment(assignmentId ?? ""),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student/submissions/assignment/{assignmentId}",
        {
          params: { path: { assignmentId: assignmentId! } },
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });
}
