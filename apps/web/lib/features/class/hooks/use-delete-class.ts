import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteClass } from "../network/delete-class";

function useDeleteClass() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centerClass"] });
      toast.success("Class deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete class");
    },
  });

  return mutation;
}

export { useDeleteClass };
