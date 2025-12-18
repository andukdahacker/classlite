import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Submission } from "@workspace/types";
import { toast } from "sonner";
import { createSubmission } from "../network/create-submission";

interface UseCreateSubmissionProps {
  onSuccess?: (data: Submission) => void;
}

function useCreateSubmission(props?: UseCreateSubmissionProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assignment"] });
      if (props?.onSuccess) {
        props.onSuccess(data);
      }
      toast.success("Submitted assignment successfully");
    },
    onError: (error) => {
      toast.error("Failed to submit due to: " + error.message);
    },
  });

  return mutation;
}

export default useCreateSubmission;
