"use client";

import { useEffect } from "react";
import useMe from "../hooks/me.hook";
import { useSignOutCenter } from "../hooks/sign-out-center.hook";
import { AuthContext } from "./auth-context";
import { useNavigate } from "react-router";

function AuthProvider({ children }: React.PropsWithChildren) {
  const { data, isPending, error } = useMe();
  const navigate = useNavigate();

  const { mutateAsync, isPending: isPendingSignOutCenter } = useSignOutCenter();

  const logOut = async () => {
    try {
      await mutateAsync();
      navigate("/sign-in");
    } catch {}
  };

  useEffect(() => {
    if (!isPending && error) {
      navigate("/sign-in");
    }
  }, [isPending, error]);

  return (
    <AuthContext
      value={{
        isAuthenticated: !!data,
        isLoading: isPending,
        center: data?.center,
        user: data?.user,
        logOut,
      }}
    >
      {children}
    </AuthContext>
  );
}

export { AuthProvider };
