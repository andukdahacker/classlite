import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

export function useDeleteComment(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await client.DELETE(
        "/api/v1/grading/submissions/{submissionId}/comments/{commentId}",
        {
          params: { path: { submissionId, commentId } },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
      toast.success("Comment deleted");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });
}
