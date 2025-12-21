import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import signInUser from "../network/sign-in-user";
import { useNavigate } from "react-router";

function useSignInUser() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: signInUser,
    onSuccess: (value) => {
      // localStorage.setItem("token", value.token);
      toast(
        "Sign in successfully. Great to have you back " + value.user.firstName,
      );
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to sign in due to error: " + error.message);
    },
  });

  return mutation;
}

export default useSignInUser;
