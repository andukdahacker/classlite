import { useMutation } from "@tanstack/react-query";
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";
import { signUpWithGoogle } from "../network/sign-up-with-google";
import { useNavigate } from "react-router";

export function useSignUpWithGoogle() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: signUpWithGoogle,
    onSuccess: (value) => {
      localStorage.setItem("token", value.token);

      navigate("/dashboard");
    },
    onError: (error) => {
      if (error instanceof FirebaseError) {
        toast.error("Failed to sign in due to error: " + error.code);
      } else {
        toast.error("Failed to sign in due to error: " + error.message);
      }
    },
  });

  return mutation;
}
