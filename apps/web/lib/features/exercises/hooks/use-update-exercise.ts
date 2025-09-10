import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateExercise } from "../network/update-exercise";

function useUpdateExercise() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: updateExercise,
    onSuccess: () => {
      toast.success("Updated exercise successfully");
      queryClient.invalidateQueries({ queryKey: ["exerciseList"] });
      router.push(`/dashboard/exercises`);
    },
    onError: (error) => {
      toast.error("Failed to update exercise due to: " + error.message);
    },
  });

  return mutation;
}

export default useUpdateExercise;
