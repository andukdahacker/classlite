import client from "@/core/client";
import type { CreateTeacherComment } from "@workspace/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

export function useCreateComment(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateTeacherComment) => {
      const { data, error } = await client.POST(
        "/api/v1/grading/submissions/{submissionId}/comments",
        {
          params: { path: { submissionId } },
          body,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });
}
