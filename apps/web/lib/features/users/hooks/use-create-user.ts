import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createUser } from "../network/create-user";

function useCreateUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
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
