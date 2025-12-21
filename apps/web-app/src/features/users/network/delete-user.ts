import { client } from "@/core/client";

async function deleteUser(userId: string) {
  const result = await client.DELETE("/api/user/{userId}", {
    params: { path: { userId } },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }
}

export { deleteUser };
