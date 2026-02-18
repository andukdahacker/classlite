import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentHealthKeys } from "./student-health-keys";
import type {
  InterventionLogRecord,
  InterventionEmailPreview,
} from "@workspace/types";

export function useInterventionHistory(studentId: string | null) {
  const query = useQuery({
    queryKey: studentHealthKeys.interventionHistory(studentId!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student-health/interventions/{studentId}",
        {
          params: { path: { studentId: studentId! } },
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const history: InterventionLogRecord[] =
    (query.data?.data as InterventionLogRecord[]) ?? [];

  return {
    history,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useInterventionPreview(studentId: string | null) {
  const query = useQuery({
    queryKey: studentHealthKeys.interventionPreview(studentId!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/student-health/interventions/{studentId}/preview",
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

  const preview: InterventionEmailPreview | null =
    (query.data?.data as InterventionEmailPreview) ?? null;

  return {
    preview,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useSendIntervention(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      studentId: string;
      recipientEmail: string;
      subject: string;
      body: string;
      templateUsed:
        | "concern-attendance"
        | "concern-assignments"
        | "concern-general";
    }) => {
      const { data, error } = await client.POST(
        "/api/v1/student-health/interventions",
        {
          body: payload,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentHealthKeys.interventionHistory(studentId),
      });
    },
  });
}
