import { client } from "@/core/client";

export async function loginWithToken(idToken: string) {
  const result = await client.POST("/api/v1/auth/login", {
    body: { idToken },
  });

  if (result.error) {
    throw new Error(result.error.message || "Login failed");
  }

  if (!result.data?.data?.user) {
    throw new Error("Login successful but user data is missing");
  }

  return result.data.data.user;
}
