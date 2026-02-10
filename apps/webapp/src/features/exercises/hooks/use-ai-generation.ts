import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GenerateQuestionsRequest,
  RegenerateQuestionsSectionRequest,
  AIGenerationJob,
} from "@workspace/types";
import { exercisesKeys } from "./use-exercises";

export const aiGenerationKeys = {
  all: ["ai-generation"] as const,
  status: (exerciseId: string) =>
    [...aiGenerationKeys.all, "status", exerciseId] as const,
};

export function useAIGeneration(exerciseId?: string) {
  const queryClient = useQueryClient();

  const { data: jobStatus, isLoading } = useQuery({
    queryKey: aiGenerationKeys.status(exerciseId!),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/exercises/{exerciseId}/generation-status",
        {
          params: { path: { exerciseId: exerciseId! } },
        },
      );
      if (error) throw error;
      return (data?.data ?? null) as AIGenerationJob | null;
    },
    enabled: !!exerciseId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "processing") return 3000;
      return false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (input: GenerateQuestionsRequest) => {
      const { data, error } = await client.POST(
        "/api/v1/exercises/{exerciseId}/generate",
        {
          params: { path: { exerciseId: exerciseId! } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as AIGenerationJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiGenerationKeys.status(exerciseId!),
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (input: RegenerateQuestionsSectionRequest) => {
      const { data, error } = await client.POST(
        "/api/v1/exercises/{exerciseId}/regenerate-section",
        {
          params: { path: { exerciseId: exerciseId! } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as AIGenerationJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiGenerationKeys.status(exerciseId!),
      });
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId!),
      });
    },
  });

  return {
    jobStatus: jobStatus ?? null,
    isLoading,
    isGenerating: ["pending", "processing"].includes(
      jobStatus?.status ?? "",
    ),
    generate: generateMutation.mutateAsync,
    isGenerateLoading: generateMutation.isPending,
    regenerateSection: regenerateMutation.mutateAsync,
    isRegenerateLoading: regenerateMutation.isPending,
  };
}
