import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateExerciseResponse } from "../../../schema/types";
import { createExercise } from "../network/create-exercise";

interface UseCreateExerciseProps {
  onSuccess?: (data: CreateExerciseResponse["data"]) => void;
  onError?: (e: Error) => void;
}

function useCreateExercise(props?: UseCreateExerciseProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createExercise,
    onSuccess: (data) => {
      toast.success("Created exercise successfully");
      queryClient.invalidateQueries({ queryKey: ["exerciseList"] });
      if (props?.onSuccess) {
        props.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error(
        "Failed to create new exercise due to error: " + error.message,
      );

      if (props?.onError) {
        props.onError(error);
      }
    },
  });

  return mutation;
}

export default useCreateExercise;
