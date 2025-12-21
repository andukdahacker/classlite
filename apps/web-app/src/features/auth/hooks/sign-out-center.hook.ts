import { useMutation } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { signOutCenter } from "../network/sign-out-center";
import { firebaseAuth } from "@/core/firebase";

function useSignOutCenter() {
  const mutation = useMutation({
    mutationFn: async () => {
      await signOut(firebaseAuth);
      await signOutCenter();
    },
    onSuccess: () => {
      toast.success("Signed out successfully. See you again!");
    },
    onError: (error) => {
      toast.error("Failed to sign out due to: " + error.message);
    },
  });

  return mutation;
}

export { useSignOutCenter };
