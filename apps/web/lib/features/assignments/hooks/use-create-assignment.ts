import { useMutation } from "@tanstack/react-query";
import { CreateAssignmentResponse } from "@workspace/types";
import { toast } from "sonner";
import { createAssignments } from "../network/create-assignment";

interface UseCreateAssignmentsProps {
  onSuccess?: (data: CreateAssignmentResponse) => void;
}

function useCreateAssignments(props?: UseCreateAssignmentsProps) {
  const mutation = useMutation({
    mutationFn: createAssignments,
    onSuccess: (data) => {
      toast.success("Assigned successfully");
      if (props?.onSuccess) {
        props.onSuccess(data);
      }
    },
    onError: (error) => {
      toast.error("Failed to assign: " + error.message);
    },
  });

  return mutation;
}

export { useCreateAssignments };
