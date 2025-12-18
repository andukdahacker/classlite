import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import createClass from "../network/create-class";

function useCreateClass() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: (value) => {
      toast("Class created successfully", {
        description: `Class "${value.class.name}" has been created.`,
        duration: 5000,
      });
      router.push(`/dashboard/class/${value.class.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create class", {
        description: `Failed to create class due to error: ${error.message}`,
      });
    },
  });

  return mutation;
}

export { useCreateClass };
