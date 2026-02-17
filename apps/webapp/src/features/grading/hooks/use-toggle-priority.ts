import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

export function useTogglePriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      isPriority,
    }: {
      submissionId: string;
      isPriority: boolean;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/grading/submissions/{submissionId}/priority",
        {
          params: { path: { submissionId } },
          body: { isPriority },
        },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ submissionId, isPriority }) => {
      // Cancel outgoing queue queries
      await queryClient.cancelQueries({ queryKey: gradingKeys.all });

      // Snapshot all queue caches for rollback
      const previousData = queryClient.getQueriesData({
        queryKey: gradingKeys.all,
      });

      // Optimistically update all queue caches
      queryClient.setQueriesData(
        { queryKey: [...gradingKeys.all, "queue"] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => {
          if (!old?.data?.items) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (item: any) =>
                  item.submissionId === submissionId
                    ? { ...item, isPriority }
                    : item,
              ),
            },
          };
        },
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to update priority");
    },
  });
}
