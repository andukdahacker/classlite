import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentHealthKeys } from "./student-health-keys";
import type { StudentFlagRecord } from "@workspace/types";

export function useStudentFlags(studentId: string | null) {
  const query = useQuery({
    queryKey: studentHealthKeys.flags(studentId ?? ""),
    queryFn: async () => {
      if (!studentId) throw new Error("studentId is required");
      const { data, error } = await client.GET(
        "/api/v1/student-health/flags/{studentId}",
        {
          params: { path: { studentId } },
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const flags: StudentFlagRecord[] =
    (query.data?.data as StudentFlagRecord[]) ?? [];

  return {
    flags,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCreateFlag(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { studentId: string; note: string }) => {
      const { data, error } = await client.POST(
        "/api/v1/student-health/flags",
        {
          body: payload,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentHealthKeys.flags(studentId),
      });
    },
  });
}

export function useResolveFlag(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      flagId: string;
      resolvedNote?: string;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/student-health/flags/{flagId}/resolve",
        {
          params: { path: { flagId: payload.flagId } },
          body: { resolvedNote: payload.resolvedNote },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentHealthKeys.flags(studentId),
      });
    },
  });
}
