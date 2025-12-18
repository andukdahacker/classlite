import { useMutation } from "@tanstack/react-query";
import { deleteListeningFile } from "../network/delete-listening-file";

interface UseDeleteListeningFileProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function useDeleteListeningFile(props?: UseDeleteListeningFileProps) {
  const mutation = useMutation({
    mutationFn: deleteListeningFile,
    onSuccess: () => {
      if (props?.onSuccess) {
        props.onSuccess();
      }
    },
    onError: (error) => {
      if (props?.onError) {
        props.onError(error);
      }
    },
  });

  return mutation;
}

export default useDeleteListeningFile;
