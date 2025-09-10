import client from "../../../core/client";

async function deleteExercise(id: string) {
  const result = await client.DELETE("/api/exercise/{id}", {
    params: { path: { id } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data;
}

export default deleteExercise;
