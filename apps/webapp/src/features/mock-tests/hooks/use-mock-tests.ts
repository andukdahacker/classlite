import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateMockTest, UpdateMockTest, MockTest } from "@workspace/types";

type MockTestFilters = {
  status?: string;
  testType?: string;
};

export const mockTestsKeys = {
  all: ["mock-tests"] as const,
  lists: () => [...mockTestsKeys.all, "list"] as const,
  list: (filters?: MockTestFilters) =>
    [...mockTestsKeys.lists(), filters] as const,
  details: () => [...mockTestsKeys.all, "detail"] as const,
  detail: (id: string) => [...mockTestsKeys.details(), id] as const,
  scorePreview: (id: string) =>
    [...mockTestsKeys.all, "score-preview", id] as const,
};

export const useMockTests = (
  centerId?: string | null,
  filters?: MockTestFilters,
) => {
  const queryClient = useQueryClient();

  const mockTestsQuery = useQuery({
    queryKey: mockTestsKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/mock-tests/", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: { query: filters as any },
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data ?? []) as MockTest[];
    },
    enabled: !!centerId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateMockTest) => {
      const { data, error } = await client.POST("/api/v1/mock-tests/", {
        body: input,
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data as MockTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.lists() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateMockTest }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/mock-tests/{id}",
        { params: { path: { id } }, body: input },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data as MockTest;
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.detail(id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/mock-tests/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.lists() });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.POST(
        "/api/v1/mock-tests/{id}/publish",
        { params: { path: { id } } },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data as MockTest;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.detail(id) });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.POST(
        "/api/v1/mock-tests/{id}/archive",
        { params: { path: { id } } },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data as MockTest;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mockTestsKeys.detail(id) });
    },
  });

  return {
    mockTests: mockTestsQuery.data ?? [],
    isLoading: mockTestsQuery.isLoading,
    createMockTest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMockTest: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMockTest: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    publishMockTest: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    archiveMockTest: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
  };
};

export const useMockTest = (centerId?: string | null, id?: string) => {

  const mockTestQuery = useQuery({
    queryKey: mockTestsKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/mock-tests/{id}",
        { params: { path: { id: id! } } },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data as MockTest;
    },
    enabled: !!centerId && !!id,
  });

  return {
    mockTest: mockTestQuery.data,
    isLoading: mockTestQuery.isLoading,
    refetch: mockTestQuery.refetch,
  };
};

export const useMockTestSections = (mockTestId?: string) => {
  const queryClient = useQueryClient();

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      input,
    }: {
      sectionId: string;
      input: { timeLimit?: number | null };
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/mock-tests/{id}/sections/{sectionId}",
        {
          params: { path: { id: mockTestId!, sectionId } },
          body: input,
        },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data;
    },
    onSuccess: () => {
      if (mockTestId) {
        queryClient.invalidateQueries({
          queryKey: mockTestsKeys.detail(mockTestId),
        });
      }
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async ({
      sectionId,
      exerciseId,
    }: {
      sectionId: string;
      exerciseId: string;
    }) => {
      const { data, error } = await client.POST(
        "/api/v1/mock-tests/{id}/sections/{sectionId}/exercises",
        {
          params: { path: { id: mockTestId!, sectionId } },
          body: { exerciseId },
        },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data;
    },
    onSuccess: () => {
      if (mockTestId) {
        queryClient.invalidateQueries({
          queryKey: mockTestsKeys.detail(mockTestId),
        });
      }
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: async ({
      sectionId,
      exerciseId,
    }: {
      sectionId: string;
      exerciseId: string;
    }) => {
      const { error } = await client.DELETE(
        "/api/v1/mock-tests/{id}/sections/{sectionId}/exercises/{exerciseId}",
        {
          params: { path: { id: mockTestId!, sectionId, exerciseId } },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      if (mockTestId) {
        queryClient.invalidateQueries({
          queryKey: mockTestsKeys.detail(mockTestId),
        });
      }
    },
  });

  const reorderExercisesMutation = useMutation({
    mutationFn: async ({
      sectionId,
      exerciseIds,
    }: {
      sectionId: string;
      exerciseIds: string[];
    }) => {
      const { error } = await client.PATCH(
        "/api/v1/mock-tests/{id}/sections/{sectionId}/exercises/reorder",
        {
          params: { path: { id: mockTestId!, sectionId } },
          body: { exerciseIds },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      if (mockTestId) {
        queryClient.invalidateQueries({
          queryKey: mockTestsKeys.detail(mockTestId),
        });
      }
    },
  });

  return {
    updateSection: updateSectionMutation.mutateAsync,
    addExercise: addExerciseMutation.mutateAsync,
    removeExercise: removeExerciseMutation.mutateAsync,
    reorderExercises: reorderExercisesMutation.mutateAsync,
  };
};

export const useMockTestScorePreview = (
  centerId?: string | null,
  mockTestId?: string,
) => {
  return useQuery({
    queryKey: mockTestsKeys.scorePreview(mockTestId!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/mock-tests/{id}/score-preview",
        { params: { path: { id: mockTestId! } } },
      );
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data;
    },
    enabled: !!centerId && !!mockTestId,
  });
};
