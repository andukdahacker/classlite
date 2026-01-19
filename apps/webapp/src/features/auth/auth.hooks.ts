import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { loginWithToken } from "./auth.api.js";
import type { AuthUser } from "@workspace/types";

export const AUTH_QUERY_KEYS = {
  user: ["auth-user"] as const,
};

/**
 * Hook to access the current authenticated user from the cache
 */
export const useAuthUserQuery = () => {
  return useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEYS.user,
    // Auth state is primarily managed by the login mutation and onAuthStateChanged
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

/**
 * Mutation to perform backend login/sync using Firebase ID Token
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idToken: string) => loginWithToken(idToken),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, user);
    },
    networkMode: "offlineFirst",
  });
};
