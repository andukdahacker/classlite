import client from "@/lib/core/client";

async function signOutCenter() {
  const result = await client.POST("/api/center/sign-out");

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data;
}

export { signOutCenter };
