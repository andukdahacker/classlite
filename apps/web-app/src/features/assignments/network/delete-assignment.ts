import client from "../../../core/client";

async function deleteAssignment(id: string) {
  const result = await client.DELETE("/api/assignment/", { body: { id } });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data;
}

export { deleteAssignment };
