import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateClass } from "../network/update-class";

function useUpdateClass() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateClass,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class", data.class.id] });
      toast.success("Updated class successfully");
    },
    onError: () => {
      toast.error("Failed to update class");
    },
  });

  return mutation;
}

export default useUpdateClass;
