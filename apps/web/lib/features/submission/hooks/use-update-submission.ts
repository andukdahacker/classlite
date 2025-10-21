import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateSubmission } from "../network/update-submission";

function useUpdateSubmission() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateSubmission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["assignment", data.assignment.id],
      });
      toast.success("Submission updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  return mutation;
}

export default useUpdateSubmission;
