import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExerciseTag,
  CreateExerciseTagInput,
  UpdateExerciseTagInput,
  MergeExerciseTagsInput,
} from "@workspace/types";
import { exercisesKeys } from "./use-exercises";

export const tagsKeys = {
  all: ["tags"] as const,
  list: () => [...tagsKeys.all, "list"] as const,
};

export function useTags(centerId?: string | null) {
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: tagsKeys.list(),
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/tags/");
      if (error) throw error;
      return (data?.data ?? []) as ExerciseTag[];
    },
    enabled: !!centerId,
  });

  const createTagMutation = useMutation({
    mutationFn: async (input: CreateExerciseTagInput) => {
      const { data, error } = await client.POST("/api/v1/tags/", {
        body: input,
      });
      if (error) throw error;
      return data?.data as ExerciseTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.list() });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateExerciseTagInput;
    }) => {
      const { data, error } = await client.PATCH("/api/v1/tags/{tagId}", {
        params: { path: { tagId: id } },
        body: input,
      });
      if (error) throw error;
      return data?.data as ExerciseTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.list() });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/tags/{tagId}", {
        params: { path: { tagId: id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.list() });
    },
  });

  const mergeTagsMutation = useMutation({
    mutationFn: async (input: MergeExerciseTagsInput) => {
      const { data, error } = await client.POST("/api/v1/tags/merge", {
        body: input,
      });
      if (error) throw error;
      return data?.data as ExerciseTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.list() });
    },
  });

  return {
    tags: tagsQuery.data ?? [],
    isLoading: tagsQuery.isLoading,
    createTag: createTagMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    mergeTags: mergeTagsMutation.mutateAsync,
  };
}

export function useExerciseTags(
  centerId?: string | null,
  exerciseId?: string,
) {
  const queryClient = useQueryClient();

  const exerciseTagsQuery = useQuery({
    queryKey: [...exercisesKeys.detail(exerciseId!), "tags"],
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/exercises/{id}/tags",
        {
          params: { path: { id: exerciseId! } },
        },
      );
      if (error) throw error;
      return (data?.data ?? []) as ExerciseTag[];
    },
    enabled: !!centerId && !!exerciseId,
  });

  const setExerciseTagsMutation = useMutation({
    mutationFn: async ({ tagIds }: { tagIds: string[] }) => {
      const { error } = await client.PUT("/api/v1/exercises/{id}/tags", {
        params: { path: { id: exerciseId! } },
        body: { tagIds },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId!),
      });
    },
  });

  return {
    exerciseTags: exerciseTagsQuery.data ?? [],
    isLoading: exerciseTagsQuery.isLoading,
    setExerciseTags: setExerciseTagsMutation.mutateAsync,
  };
}
