import { client } from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exercisesKeys } from "./use-exercises";

export function useDocumentUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      file,
    }: {
      exerciseId: string;
      file: File;
    }): Promise<{
      extractedText: string;
      passageSourceType: string;
      passageSourceUrl: string | null;
    }> => {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await client.POST(
        "/api/v1/exercises/{exerciseId}/upload-document",
        {
          params: { path: { exerciseId } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: formData as any,
        },
      );

      if (error) {
        throw new Error(
          (error as { message?: string }).message ||
            "Failed to upload document",
        );
      }

      if (!data.data) {
        throw new Error("Failed to upload document");
      }
      return data.data;
    },
    onSuccess: (_data, { exerciseId }) => {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId),
      });
    },
  });
}
