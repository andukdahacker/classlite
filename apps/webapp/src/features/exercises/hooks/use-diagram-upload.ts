import { client } from "@/core/client";
import { useMutation } from "@tanstack/react-query";

export function useDiagramUpload() {
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
        "/api/v1/exercises/{exerciseId}/diagram",
        {
          params: { path: { exerciseId } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: formData as any,
        },
      );

      if (error) {
        throw new Error(
          (error as { message?: string }).message || "Failed to upload diagram",
        );
      }

      if (!data?.data?.diagramUrl) {
        throw new Error("Failed to upload diagram");
      }

      return data.data.diagramUrl;
    },
  });
}
