import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Exercise,
  ExerciseSkill,
  ExerciseStatus,
  CreateExerciseInput,
  UpdateExerciseInput,
  AutosaveExerciseInput,
} from "@workspace/types";

type ExerciseFilters = {
  skill?: ExerciseSkill;
  status?: ExerciseStatus;
};

export const exercisesKeys = {
  all: ["exercises"] as const,
  lists: () => [...exercisesKeys.all, "list"] as const,
  list: (filters?: ExerciseFilters) =>
    [...exercisesKeys.lists(), filters] as const,
  details: () => [...exercisesKeys.all, "detail"] as const,
  detail: (id: string) => [...exercisesKeys.details(), id] as const,
};

export const useExercises = (
  centerId?: string | null,
  filters?: ExerciseFilters,
) => {
  const queryClient = useQueryClient();

  const exercisesQuery = useQuery({
    queryKey: exercisesKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/exercises/", {
        params: {
          query: filters,
        },
      });
      if (error) throw error;
      return (data?.data ?? []) as Exercise[];
    },
    enabled: !!centerId,
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      const { data, error } = await client.POST("/api/v1/exercises/", {
        body: input,
      });
      if (error) throw error;
      return data?.data as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateExerciseInput;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/exercises/{id}",
        {
          params: { path: { id } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as Exercise;
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: exercisesKeys.detail(id) });
      const previous = queryClient.getQueryData<Exercise>(exercisesKeys.detail(id));
      if (previous) {
        queryClient.setQueryData<Exercise>(exercisesKeys.detail(id), {
          ...previous,
          ...input,
        });
      }
      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(exercisesKeys.detail(context.id), context.previous);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exercisesKeys.detail(id) });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/exercises/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
    },
  });

  const publishExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.POST(
        "/api/v1/exercises/{id}/publish",
        {
          params: { path: { id } },
        },
      );
      if (error) throw error;
      return data?.data as Exercise;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exercisesKeys.detail(id) });
    },
  });

  const archiveExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.POST(
        "/api/v1/exercises/{id}/archive",
        {
          params: { path: { id } },
        },
      );
      if (error) throw error;
      return data?.data as Exercise;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exercisesKeys.detail(id) });
    },
  });

  return {
    exercises: exercisesQuery.data ?? [],
    isLoading: exercisesQuery.isLoading,
    createExercise: createExerciseMutation.mutateAsync,
    isCreating: createExerciseMutation.isPending,
    updateExercise: updateExerciseMutation.mutateAsync,
    isUpdating: updateExerciseMutation.isPending,
    deleteExercise: deleteExerciseMutation.mutateAsync,
    isDeleting: deleteExerciseMutation.isPending,
    publishExercise: publishExerciseMutation.mutateAsync,
    isPublishing: publishExerciseMutation.isPending,
    archiveExercise: archiveExerciseMutation.mutateAsync,
    isArchiving: archiveExerciseMutation.isPending,
  };
};

export const useExercise = (centerId?: string | null, exerciseId?: string) => {
  const queryClient = useQueryClient();

  const exerciseQuery = useQuery({
    queryKey: exercisesKeys.detail(exerciseId!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/exercises/{id}",
        {
          params: { path: { id: exerciseId! } },
        },
      );
      if (error) throw error;
      return data?.data as Exercise;
    },
    enabled: !!centerId && !!exerciseId,
  });

  const autosaveMutation = useMutation({
    mutationFn: async (input: AutosaveExerciseInput) => {
      const { data, error } = await client.PATCH(
        "/api/v1/exercises/{id}/autosave",
        {
          params: { path: { id: exerciseId! } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId!),
      });
    },
  });

  return {
    exercise: exerciseQuery.data,
    isLoading: exerciseQuery.isLoading,
    refetch: exerciseQuery.refetch,
    autosave: autosaveMutation.mutateAsync,
    isAutosaving: autosaveMutation.isPending,
  };
};
