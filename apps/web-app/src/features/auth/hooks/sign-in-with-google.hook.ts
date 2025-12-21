import { useMutation } from "@tanstack/react-query";
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";
import { signInWithGoogle } from "../network/sign-in-with-google";
import { useNavigate } from "react-router";

export function useSignInWithGoogle() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (value) => {
      localStorage.setItem("token", value.token);
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
      console.log("here");
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
