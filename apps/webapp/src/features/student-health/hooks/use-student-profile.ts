import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { studentHealthKeys } from "./student-health-keys";
import type { StudentProfileResponse } from "@workspace/types";

export function useStudentProfile(studentId: string | null) {
  const query = useQuery({
    queryKey: studentHealthKeys.profile(studentId!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student-health/profile/{studentId}",
        {
          params: { path: { studentId: studentId! } },
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
    staleTime: 60_000,
  });

  const profile: StudentProfileResponse | null =
    (query.data?.data as StudentProfileResponse) ?? null;

  return {
    profile,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
