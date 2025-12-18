import client from "@/core/client";

async function getExercise(id: string) {
  const result = await client.GET("/api/exercise/{id}", {
    params: { path: { id } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getExercise };
