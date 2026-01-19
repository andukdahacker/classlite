import { client } from "@/core/client";
import type { CenterSignupRequest } from "@workspace/types";

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

export async function signupCenter(input: CenterSignupRequest) {
  const result = await client.POST("/api/v1/auth/signup/center", {
    body: input,
  });

  if (result.error) {
    throw new Error(result.error.message || "Registration failed");
  }

  if (!result.data?.data?.user) {
    throw new Error("Registration successful but user data is missing");
  }

  return result.data.data.user;
}
