import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/core/client";
import type {
  UserListQuery,
  UserListResponse,
  UserProfileResponse,
  ChangeRoleRequest,
  BulkUserActionRequest,
  InvitationListResponse,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@workspace/types";

// Query keys
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters: UserListQuery) => [...usersKeys.lists(), filters] as const,
  detail: (userId: string) => [...usersKeys.all, "detail", userId] as const,
  invitations: () => [...usersKeys.all, "invitations"] as const,
};

// Fetch users list
export function useUsers(query: UserListQuery) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: async (): Promise<UserListResponse["data"]> => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(query.page));
      searchParams.set("limit", String(query.limit));
      if (query.search) searchParams.set("search", query.search);
      if (query.role) searchParams.set("role", query.role);
      if (query.status) searchParams.set("status", query.status);

      const result = await client.GET("/api/v1/users/", {
        params: { query: Object.fromEntries(searchParams) },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch users");
      }

      return result.data.data;
    },
  });
}

// Fetch single user profile
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: usersKeys.detail(userId ?? ""),
    queryFn: async (): Promise<UserProfileResponse["data"]> => {
      const result = await client.GET("/api/v1/users/{userId}", {
        params: { path: { userId: userId! } },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch user");
      }

      return result.data.data;
    },
    enabled: !!userId,
  });
}

// Fetch invitations
export function useInvitations(status?: string) {
  return useQuery({
    queryKey: [...usersKeys.invitations(), status],
    queryFn: async (): Promise<InvitationListResponse["data"]> => {
      const searchParams = new URLSearchParams();
      if (status) searchParams.set("status", status);

      const result = await client.GET("/api/v1/users/invitations", {
        params: { query: Object.fromEntries(searchParams) },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch invitations");
      }

      return result.data.data;
    },
  });
}

// Change role mutation
export function useChangeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: ChangeRoleRequest["role"];
    }) => {
      const result = await client.PATCH("/api/v1/users/{userId}/role", {
        params: { path: { userId } },
        body: { role },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to change role");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Deactivate user mutation
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await client.PATCH("/api/v1/users/{userId}/deactivate", {
        params: { path: { userId } },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to deactivate user");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Reactivate user mutation
export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await client.PATCH("/api/v1/users/{userId}/reactivate", {
        params: { path: { userId } },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to reactivate user");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Bulk deactivate mutation
export function useBulkDeactivate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkUserActionRequest) => {
      const result = await client.POST("/api/v1/users/bulk-deactivate", {
        body: input,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to bulk deactivate");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Bulk remind mutation
export function useBulkRemind() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkUserActionRequest) => {
      const result = await client.POST("/api/v1/users/bulk-remind", {
        body: input,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to send reminders");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Resend invitation mutation
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await client.POST(
        "/api/v1/users/invitations/{id}/resend",
        {
          params: { path: { id: invitationId } },
        }
      );

      if (result.error) {
        throw new Error(result.error.message || "Failed to resend invitation");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.invitations() });
    },
  });
}

// Revoke invitation mutation
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await client.DELETE("/api/v1/users/invitations/{id}", {
        params: { path: { id: invitationId } },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to revoke invitation");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.invitations() });
    },
  });
}

// Update own profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const result = await client.PATCH("/api/v1/users/me/profile", {
        body: input,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update profile");
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      // Update auth user cache with new profile data
      queryClient.setQueryData(["auth-user"], (old: unknown) => {
        if (!old) return old;
        return { ...(old as object), ...data.data };
      });
    },
  });
}

// Check if user has password provider
export function useHasPassword() {
  return useQuery({
    queryKey: [...usersKeys.all, "has-password"] as const,
    queryFn: async (): Promise<{ hasPassword: boolean }> => {
      const result = await client.GET("/api/v1/users/me/has-password");

      if (result.error) {
        throw new Error(result.error.message || "Failed to check password status");
      }

      return result.data;
    },
  });
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const result = await client.POST("/api/v1/users/me/change-password", {
        body: input,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }

      return result.data;
    },
  });
}

// Request account deletion mutation
export function useRequestDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await client.POST("/api/v1/users/me/request-deletion");

      if (result.error) {
        throw new Error(result.error.message || "Failed to request deletion");
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      // Update auth user cache with deletion timestamp
      queryClient.setQueryData(["auth-user"], (old: unknown) => {
        if (!old) return old;
        return { ...(old as object), deletionRequestedAt: data.data.deletionRequestedAt };
      });
    },
  });
}

// Cancel account deletion mutation
export function useCancelDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await client.POST("/api/v1/users/me/cancel-deletion");

      if (result.error) {
        throw new Error(result.error.message || "Failed to cancel deletion");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      // Clear deletion timestamp from auth user cache
      queryClient.setQueryData(["auth-user"], (old: unknown) => {
        if (!old) return old;
        return { ...(old as object), deletionRequestedAt: null };
      });
    },
  });
}

// Upload avatar mutation
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const result = await client.POST("/api/v1/users/me/avatar", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: formData as any,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to upload avatar");
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      // Update auth user cache with new avatar URL
      queryClient.setQueryData(["auth-user"], (old: unknown) => {
        if (!old) return old;
        return { ...(old as object), avatarUrl: data?.data?.avatarUrl };
      });
    },
  });
}
