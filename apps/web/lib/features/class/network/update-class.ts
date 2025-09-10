import client from "../../../core/client";
import { UpdateClassInput } from "../../../schema/types";

async function updateClass(input: UpdateClassInput) {
  const result = await client.PUT("/api/class/", {
    body: input,
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { updateClass };
