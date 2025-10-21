import client from "../../../core/client";

async function getAssignmentByExercise(exerciseId: string) {
  const result = await client.GET("/api/assignment/exercise", {
    params: { query: { exerciseId } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getAssignmentByExercise };
