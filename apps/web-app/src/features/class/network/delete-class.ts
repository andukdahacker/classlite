import client from "../../../core/client";

async function deleteClass(classId: string) {
  const result = await client.DELETE("/api/class/{classId}", {
    params: { path: { classId } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }
}

export { deleteClass };
