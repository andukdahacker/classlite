import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { studentHealthKeys } from "./student-health-keys";
import type { TeacherAtRiskWidgetResponse } from "@workspace/types";

export function useTeacherAtRiskWidget() {
  const query = useQuery({
    queryKey: studentHealthKeys.teacherAtRiskWidget(),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student-health/dashboard/teacher-widget",
      );
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const widget: TeacherAtRiskWidgetResponse | null =
    (query.data?.data as TeacherAtRiskWidgetResponse) ?? null;

  return {
    widget,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
