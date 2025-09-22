import { UpdateExerciseInput } from "@workspace/types";
import client from "../../../core/client";

async function updateExercise(input: UpdateExerciseInput) {
  const result = await client.PUT("/api/exercise/", { body: input });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { updateExercise };
