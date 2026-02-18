import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { studentHealthKeys } from "./student-health-keys";
import type { HealthSummary, StudentHealthCard } from "@workspace/types";

const DEFAULT_SUMMARY: HealthSummary = {
  total: 0,
  atRisk: 0,
  warning: 0,
  onTrack: 0,
};

export function useStudentHealthDashboard(
  filters?: { classId?: string; search?: string },
) {
  const query = useQuery({
    queryKey: studentHealthKeys.dashboard(filters),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student-health/dashboard",
        {
          params: { query: filters ?? {} },
        },
      );
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const students: StudentHealthCard[] =
    (query.data?.data?.students as StudentHealthCard[]) ?? [];
  const summary: HealthSummary =
    (query.data?.data?.summary as HealthSummary) ?? DEFAULT_SUMMARY;

  return {
    students,
    summary,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
