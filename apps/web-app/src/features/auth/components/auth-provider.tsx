"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useMe from "../hooks/me.hook";
import { useSignOutCenter } from "../hooks/sign-out-center.hook";
import { AuthContext } from "./auth-context";

function AuthProvider({ children }: React.PropsWithChildren) {
  const { data, isPending, error } = useMe();
  const router = useRouter();

  const { mutateAsync, isPending: isPendingSignOutCenter } = useSignOutCenter();

  const logOut = async () => {
    try {
      await mutateAsync();
      router.replace("/sign-in");
    } catch {}
  };

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
        logOut,
      }}
    >
      {children}
    </AuthContext>
  );
}

export { AuthProvider };
