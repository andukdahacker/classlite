import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import deleteExercise from "../network/delete-exercise";

function useDeleteExercise() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      toast.success("Deleted exericse successfully");
      queryClient.invalidateQueries({ queryKey: ["exerciseList"] });
      navigate("/dashboard/exercises");
    },
    onError: (error) => {
      toast.error("Failed to delete exericise due to: " + error.message);
    },
  });

  return mutation;
}

export default useDeleteExercise;
