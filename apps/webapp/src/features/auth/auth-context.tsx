import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth } from "@/core/firebase";
import type { AuthUser } from "@workspace/types";
import {
  useAuthUserQuery,
  useLoginMutation,
  AUTH_QUERY_KEYS,
} from "./auth.hooks.js";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: user } = useAuthUserQuery();
  const { mutateAsync: login, isPending: isLoggingIn } = useLoginMutation();

  // Use a ref to keep the stable reference of the login function
  // to prevent infinite loops in useEffect
  const loginRef = React.useRef(login);
  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  const logout = async () => {
    await firebaseAuth.signOut();
    queryClient.setQueryData(AUTH_QUERY_KEYS.user, null);
    setFirebaseUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          await loginRef.current(token);
        } catch (error) {
          console.error("Session sync failed:", error);
        }
      } else {
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        firebaseUser,
        loading: loading || isLoggingIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
