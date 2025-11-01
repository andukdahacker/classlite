import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@workspace/types";
import { toast } from "sonner";
import { createUser } from "../network/create-user";

interface UseCreateUserProps {
  onSuccess?: (user: User) => void;
}

function useCreateUser(props?: UseCreateUserProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      if (props?.onSuccess) {
        props.onSuccess(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast("Created new user successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create new user due to: ${error.message}`);
    },
  });

  return mutation;
}

export { useCreateUser };
