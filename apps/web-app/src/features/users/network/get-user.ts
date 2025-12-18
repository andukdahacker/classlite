import client from "@/core/client";

async function getUser(id: string) {
  const result = await client.GET("/api/user/{id}", {
    params: { path: { id } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getUser };
