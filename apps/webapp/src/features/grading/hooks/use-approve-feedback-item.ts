import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradingKeys } from "./grading-keys";

interface ApproveFeedbackItemInput {
  itemId: string;
  data: { isApproved: boolean; teacherOverrideText?: string | null };
}

export function useApproveFeedbackItem(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, data }: ApproveFeedbackItemInput) => {
      const { data: result, error } = await client.PATCH(
        "/api/v1/grading/submissions/{submissionId}/feedback/items/{itemId}",
        {
          params: { path: { submissionId, itemId } },
          body: data,
        },
      );
      if (error) throw error;
      return result;
    },
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({
        queryKey: gradingKeys.detail(submissionId),
      });
      const previous = queryClient.getQueryData(
        gradingKeys.detail(submissionId),
      );
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
                item.id === itemId
                  ? {
                      ...item,
                      isApproved: data.isApproved,
                      approvedAt: data.isApproved
                        ? new Date().toISOString()
                        : null,
                      teacherOverrideText:
                        data.teacherOverrideText ?? item.teacherOverrideText,
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
      toast.error("Failed to update feedback item");
    },
  });
}
