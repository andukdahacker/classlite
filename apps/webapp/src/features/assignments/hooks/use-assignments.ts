import client from "@/core/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateAssignmentInput, UpdateAssignmentInput, ReopenAssignmentInput, AssignmentStatus, Assignment } from "@workspace/types";

export const assignmentsKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentsKeys.all, "list"] as const,
  list: (filters: AssignmentFilters) => [...assignmentsKeys.lists(), filters] as const,
  details: () => [...assignmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...assignmentsKeys.details(), id] as const,
  counts: () => [...assignmentsKeys.all, "counts"] as const,
};

export type AssignmentFilters = {
  exerciseId?: string;
  classId?: string;
  status?: AssignmentStatus;
  skill?: string;
  dueDateStart?: string;
  dueDateEnd?: string;
};

export function useAssignments(centerId: string | undefined, filters: AssignmentFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: assignmentsKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/assignments/", {
        params: { query: filters },
      });
      if (error) throw error;
      return (data?.data ?? []) as Assignment[];
    },
    enabled: !!centerId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      const { data, error } = await client.POST("/api/v1/assignments/", {
        body: input,
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.counts() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAssignmentInput }) => {
      const { data, error } = await client.PATCH("/api/v1/assignments/{id}", {
        params: { path: { id } },
        body: input,
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.POST("/api/v1/assignments/{id}/close", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReopenAssignmentInput }) => {
      const { data, error } = await client.POST("/api/v1/assignments/{id}/reopen", {
        params: { path: { id } },
        body: input,
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.POST("/api/v1/assignments/{id}/archive", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.DELETE("/api/v1/assignments/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.counts() });
    },
  });

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    createAssignment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAssignment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    closeAssignment: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,
    reopenAssignment: reopenMutation.mutateAsync,
    isReopening: reopenMutation.isPending,
    archiveAssignment: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
    deleteAssignment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useAssignment(centerId: string | undefined, id: string) {
  return useQuery({
    queryKey: assignmentsKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/assignments/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data?.data;
    },
    enabled: !!centerId && !!id,
  });
}

export function useAssignmentCounts(exerciseIds: string[]) {
  return useQuery({
    queryKey: [...assignmentsKeys.counts(), exerciseIds],
    queryFn: async () => {
      if (exerciseIds.length === 0) return [];
      const { data, error } = await client.POST("/api/v1/assignments/counts-by-exercise", {
        body: { exerciseIds },
      });
      if (error) throw error;
      return data?.data ?? [];
    },
    enabled: exerciseIds.length > 0,
  });
}
