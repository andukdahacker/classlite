import { DeleteListeningFileInput } from "@workspace/types";
import client from "../../../core/client";

async function deleteListeningFile(input: DeleteListeningFileInput) {
  const result = await client.DELETE("/api/exercise/deleteListeningFile", {
    body: input,
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data;
}

export { deleteListeningFile };
