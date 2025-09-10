"use client";

import { useEffect } from "react";
import useMe from "../hooks/me.hook";
import { AuthContext } from "./auth-context";

function AuthProvider({ children }: React.PropsWithChildren) {
  const { data, isPending, error } = useMe();

  useEffect(() => {
    if (!isPending && error) {
      window.history.replaceState(null, "", "/sign-in");
    }
  }, [isPending, error]);

  return (
    <AuthContext
      value={{
        isAuthenticated: !!data,
        isLoading: isPending,
        center: data?.center,
        user: data?.user,
      }}
    >
      {children}
    </AuthContext>
  );
}

export { AuthProvider };
