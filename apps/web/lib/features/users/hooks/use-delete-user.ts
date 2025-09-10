import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteUser } from "../network/delete-user";

interface UseDeleteUserProps {
  onSuccess?: () => void;
}

function useDeleteUser(props?: UseDeleteUserProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      if (props?.onSuccess) {
        props.onSuccess();
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast("Deleted user successfully");
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  return mutation;
}

export { useDeleteUser };
