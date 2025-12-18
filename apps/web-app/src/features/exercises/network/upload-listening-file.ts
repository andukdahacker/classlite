import client from "@/core/client";
import type { UploadListeningFileInput } from "@workspace/types";

async function uploadListeningFile(input: UploadListeningFileInput) {
  const result = await client.POST("/api/exercise/uploadListeningFile", {
    body: input,
    bodySerializer: (data) => {
      const formData = new FormData();

      formData.append("file", new Blob([input.file as ArrayBuffer]));
      formData.append("fileName", data.fileName);
      formData.append("id", data.id);

      return formData;
    },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { uploadListeningFile };
