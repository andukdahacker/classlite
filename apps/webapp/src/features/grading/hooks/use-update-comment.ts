import client from "@/core/client";
import type { UpdateTeacherComment } from "@workspace/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

export function useUpdateComment(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      data,
    }: {
      commentId: string;
      data: UpdateTeacherComment;
    }) => {
      const { data: result, error } = await client.PATCH(
        "/api/v1/grading/submissions/{submissionId}/comments/{commentId}",
        {
          params: { path: { submissionId, commentId } },
          body: data,
        },
      );
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });
}
