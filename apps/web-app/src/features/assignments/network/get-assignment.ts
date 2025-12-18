import client from "../../../core/client";

async function getAssignment(id: string) {
  const result = await client.GET("/api/assignment/{id}", {
    params: { path: { id } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getAssignment };
