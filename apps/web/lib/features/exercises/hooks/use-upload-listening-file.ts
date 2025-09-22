import { useMutation } from "@tanstack/react-query";
import { Exercise } from "@workspace/types";
import { toast } from "sonner";
import { uploadListeningFile } from "../network/upload-listening-file";

interface UseUploadListeningFileProps {
  onSuccess?: (data: Exercise) => void;
  onError?: (error: Error) => void;
}

function useUploadListeningFile(props?: UseUploadListeningFileProps) {
  const mutation = useMutation({
    mutationFn: uploadListeningFile,
    onSuccess: (data) => {
      if (props?.onSuccess) {
        props.onSuccess(data);
      }
      toast.success("Uploaded listening file");
    },
    onError: (error) => {
      if (props?.onError) {
        props.onError(error);
      }

      toast.error("Failed to upload listening file due to " + error.message);
    },
  });

  return mutation;
}

export default useUploadListeningFile;
