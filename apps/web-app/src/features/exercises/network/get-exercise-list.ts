import client from "@/core/client";
import type { GetExerciseListInput } from "@workspace/types";

async function getExerciseList(input: GetExerciseListInput) {
  const result = await client.GET("/api/exercise/list", {
    params: { query: input },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getExerciseList };
