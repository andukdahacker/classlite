import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

interface BulkApproveInput {
  action: "approve_remaining" | "reject_remaining";
}

export function useBulkApprove(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action }: BulkApproveInput) => {
      const { data, error } = await client.PATCH(
        "/api/v1/grading/submissions/{submissionId}/feedback/items/bulk",
        {
          params: { path: { submissionId } },
          body: { action },
        },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ action }) => {
      await queryClient.cancelQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
      const previous = queryClient.getQueryData(
        gradingKeys.detail(submissionId),
      );
      const isApproved = action === "approve_remaining";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(gradingKeys.detail(submissionId), (old: any) => {
        if (!old?.data?.feedback?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            feedback: {
              ...old.data.feedback,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              items: old.data.feedback.items.map((item: any) =>
                item.isApproved === null || item.isApproved === undefined
                  ? {
                      ...item,
                      isApproved,
                      approvedAt: isApproved
                        ? new Date().toISOString()
                        : null,
                    }
                  : item,
              ),
            },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        gradingKeys.detail(submissionId),
        context?.previous,
      );
      toast.error("Failed to update feedback items");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
    },
  });
}
