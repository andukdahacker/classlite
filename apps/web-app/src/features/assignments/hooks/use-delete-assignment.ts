import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAssignment } from "../network/delete-assignment";

function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment"] });
      toast.success("Deleted assignment successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete assignment: " + error.message);
    },
  });

  return mutation;
}

export { useDeleteAssignment };
