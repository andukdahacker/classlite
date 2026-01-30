import { client } from "@/core/client";
import type {
  CenterSignupRequest,
  CenterSignupWithGoogleRequest,
} from "@workspace/types";

interface LoginAttemptStatus {
  locked: boolean;
  retryAfterMinutes?: number;
  attemptsRemaining?: number;
}

/**
 * Check if account is locked due to too many failed login attempts
 */
export async function checkLoginAttempt(
  email: string
): Promise<LoginAttemptStatus> {
  try {
    const result = await client.GET("/api/v1/auth/login-attempt/{email}", {
      params: { path: { email } },
    });

    if (result.error) {
      // If endpoint doesn't exist or errors, assume not locked
      return { locked: false };
    }

    return result.data?.data ?? { locked: false };
  } catch {
    // On network error, allow login attempt
    return { locked: false };
  }
}

interface RecordLoginAttemptResult {
  locked: boolean;
  retryAfterMinutes?: number;
}

/**
 * Record a login attempt (success or failure) for rate limiting
 * Returns lock status after recording the attempt
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean
): Promise<RecordLoginAttemptResult> {
  try {
    const result = await client.POST("/api/v1/auth/login-attempt", {
      body: { email, success },
    });

    // 423 Locked response indicates account is now locked
    if (result.response.status === 423) {
      const retryMatch = result.error?.message?.match(/(\d+) minutes/);
      return {
        locked: true,
        retryAfterMinutes: retryMatch ? parseInt(retryMatch[1], 10) : 15,
      };
    }

    return result.data?.data ?? { locked: false };
  } catch {
    // Silently fail - don't block login if tracking fails
    return { locked: false };
  }
}

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

export async function signupCenterWithGoogle(
  input: CenterSignupWithGoogleRequest,
) {
  const result = await client.POST("/api/v1/auth/signup/center/google", {
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
