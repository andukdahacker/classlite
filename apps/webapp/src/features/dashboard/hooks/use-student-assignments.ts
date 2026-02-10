import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import type { StudentAssignment } from "@workspace/types";

export const studentAssignmentsKeys = {
  all: ["student-assignments"] as const,
  lists: () => [...studentAssignmentsKeys.all, "list"] as const,
  list: (filters: StudentAssignmentFilters) => [...studentAssignmentsKeys.lists(), filters] as const,
};

type StudentAssignmentFilters = {
  skill?: string;
  status?: "OPEN" | "CLOSED";
};

export function useStudentAssignments(centerId: string | null | undefined, filters: StudentAssignmentFilters = {}) {
  const query = useQuery({
    queryKey: studentAssignmentsKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/student/assignments/", {
        params: { query: filters },
      });
      if (error) throw error;
      return (data?.data ?? []) as StudentAssignment[];
    },
    enabled: !!centerId,
  });

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
