import { client } from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exercisesKeys } from "./use-exercises";

export function useAudioUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      file,
    }: {
      exerciseId: string;
      file: File;
    }): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await client.POST(
        "/api/v1/exercises/{exerciseId}/audio",
        {
          params: { path: { exerciseId } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: formData as any,
        },
      );

      if (error) {
        throw new Error(
          (error as { message?: string }).message || "Failed to upload audio",
        );
      }

      if (!data?.data?.audioUrl) {
        throw new Error("Failed to upload audio");
      }

      return data.data.audioUrl;
    },
    onSuccess: (_data, { exerciseId }) => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId),
      });
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
    },
  });
}

export function useAudioDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
    }: {
      exerciseId: string;
    }): Promise<void> => {
      const { error } = await client.DELETE(
        "/api/v1/exercises/{exerciseId}/audio",
        {
          params: { path: { exerciseId } },
        },
      );

      if (error) {
        throw new Error(
          (error as { message?: string }).message || "Failed to delete audio",
        );
      }
    },
    onSuccess: (_data, { exerciseId }) => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId),
      });
      queryClient.invalidateQueries({ queryKey: exercisesKeys.lists() });
    },
  });
}
