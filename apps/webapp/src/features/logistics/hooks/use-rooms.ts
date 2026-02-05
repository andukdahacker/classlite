import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Room, CreateRoomInput, UpdateRoomInput } from "@workspace/types";

export const useRooms = (centerId?: string | null) => {
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: ["rooms", centerId],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/logistics/rooms/");
      if (error) throw error;
      return (data?.data ?? []) as Room[];
    },
    enabled: !!centerId,
  });

  const createRoomMutation = useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      const { data, error } = await client.POST("/api/v1/logistics/rooms/", {
        body: input,
      });
      if (error) throw error;
      return data?.data as Room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", centerId] });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomInput }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/logistics/rooms/{id}",
        {
          params: { path: { id } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as Room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", centerId] });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/logistics/rooms/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", centerId] });
    },
  });

  return {
    rooms: roomsQuery.data ?? [],
    isLoading: roomsQuery.isLoading,
    createRoom: createRoomMutation.mutateAsync,
    isCreating: createRoomMutation.isPending,
    updateRoom: updateRoomMutation.mutateAsync,
    isUpdating: updateRoomMutation.isPending,
    deleteRoom: deleteRoomMutation.mutateAsync,
    isDeleting: deleteRoomMutation.isPending,
  };
};
