import { useMutation } from "@tanstack/react-query";
import deleteWritingImage from "../network/delete-writing-file";

interface UseDeleteWritingImageProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function useDeleteWritingImage(props?: UseDeleteWritingImageProps) {
  const mutation = useMutation({
    mutationFn: deleteWritingImage,
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

export default useDeleteWritingImage;
