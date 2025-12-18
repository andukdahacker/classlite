import client from "../../../core/client";

async function getClass(id: string) {
  const result = await client.GET("/api/class/{classId}", {
    params: { path: { classId: id } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getClass };
