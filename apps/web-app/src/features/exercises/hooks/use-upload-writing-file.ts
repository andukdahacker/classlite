import { useMutation } from "@tanstack/react-query";
import type { Exercise } from "@workspace/types";
import { toast } from "sonner";
import { uploadWritingFile } from "../network/upload-writing-file";

interface UseUploadWritingImageProps {
  onSuccess?: (data: Exercise) => void;
  onError?: (error: Error) => void;
}

function useUploadWritingImage(props?: UseUploadWritingImageProps) {
  const mutation = useMutation({
    mutationFn: uploadWritingFile,
    onSuccess: (data) => {
      if (props?.onSuccess) {
        props.onSuccess(data);
      }

      toast.success("Uploaded writing file successfully");
    },
    onError: (error) => {
      if (props?.onError) {
        props.onError(error);
      }

      toast.error("Failed to upload writing file");
    },
  });

  return mutation;
}

export default useUploadWritingImage;
