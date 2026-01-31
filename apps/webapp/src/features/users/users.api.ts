import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/core/client";
import type {
  UserListQuery,
  UserListResponse,
  UserProfileResponse,
  ChangeRoleRequest,
  BulkUserActionRequest,
  InvitationListResponse,
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
