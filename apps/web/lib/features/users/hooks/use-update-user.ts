import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@workspace/types";
import { toast } from "sonner";
import { updateUser } from "../network/update-user";

interface UseUpdateUserProps {
  onSuccess?: (user: User) => void;
}

function useUpdateUser(props?: UseUpdateUserProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      if (props?.onSuccess) {
        props.onSuccess(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast("Updated user successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user");
    },
  });

  return mutation;
}

export { useUpdateUser };
