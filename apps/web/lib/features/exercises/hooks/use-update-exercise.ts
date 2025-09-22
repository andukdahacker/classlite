import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateExercise } from "../network/update-exercise";

function useUpdateExercise() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateExercise,
    onSuccess: (data) => {
      toast.success("Updated exercise successfully");
      queryClient.invalidateQueries({
        queryKey: ["exerciseList"],
      });

      queryClient.invalidateQueries({
        queryKey: ["exercise", data.id],
      });
    },
    onError: (error) => {
      toast.error("Failed to update exercise due to: " + error.message);
    },
  });

  return mutation;
}

export default useUpdateExercise;
