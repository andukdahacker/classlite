import { CreateExerciseInput } from "@workspace/types";
import client from "../../../core/client";

async function createExercise(input: CreateExerciseInput) {
  const result = await client.POST("/api/exercise/", { body: input });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { createExercise };
