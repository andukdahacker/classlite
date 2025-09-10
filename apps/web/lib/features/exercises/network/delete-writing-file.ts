import client from "../../../core/client";
import { DeleteWritingImageInput } from "../../../schema/types";

async function deleteWritingImage(input: DeleteWritingImageInput) {
  const result = await client.DELETE("/api/exercise/writingImage", {
    body: input,
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data;
}

export default deleteWritingImage;
