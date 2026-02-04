import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  onIdTokenChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth } from "@/core/firebase";
import type { AuthUser } from "@workspace/types";
import {
  useAuthUserQuery,
  useLoginMutation,
  AUTH_QUERY_KEYS,
} from "./auth.hooks.js";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  sessionExpired: boolean;
  setSignupInProgress: (inProgress: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const signupInProgressRef = React.useRef(false);

  const setSignupInProgress = useCallback((inProgress: boolean) => {
    console.log("setSignupInProgress called with:", inProgress);
    signupInProgressRef.current = inProgress;
  }, []);

  const { data: user } = useAuthUserQuery();
  const { mutateAsync: login, isPending: isLoggingIn } = useLoginMutation();

  // Use a ref to keep the stable reference of the login function
  // to prevent infinite loops in useEffect
  const loginRef = React.useRef(login);
  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await firebaseAuth.signOut();
    } catch {
      // Ignore sign out errors
    }
    localStorage.removeItem("token");
    queryClient.setQueryData(AUTH_QUERY_KEYS.user, null);
    queryClient.clear(); // Clear all cached data on logout
    setFirebaseUser(null);
    setSessionExpired(false);
  }, [queryClient]);

  // Handle session expiry redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "true") {
      setSessionExpired(true);
      toast.error("Your session has expired. Please sign in again.");
      // Clean up the URL
      params.delete("expired");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      console.log("=== onAuthStateChanged fired ===", fbUser?.uid);
      setFirebaseUser(fbUser);

      console.log("Firebase user:", fbUser);

      if (fbUser) {
        // Skip automatic login if signup is in progress - the signup flow
        // will handle authentication after creating the user in the backend
        console.log("onAuthStateChanged - signupInProgressRef:", signupInProgressRef.current);
        if (signupInProgressRef.current) {
          console.log("Skipping login - signup in progress");
          setLoading(false);
          return;
        }

        try {
          const token = await fbUser.getIdToken();
          localStorage.setItem("token", token);
          console.log("onAuthStateChanged - calling login");
          await loginRef.current(token);
          console.log("onAuthStateChanged - login completed");
          setSessionExpired(false);
        } catch (err) {
          console.log("onAuthStateChanged - login failed:", err);
          // Session sync failed - user will be prompted to re-login if needed
        }
      } else {
        localStorage.removeItem("token");
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [queryClient]);

  // Silent token refresh listener
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (fbUser) => {
      // Skip token refresh during signup - the signup flow handles authentication
      console.log("onIdTokenChanged - signupInProgressRef:", signupInProgressRef.current);
      if (signupInProgressRef.current) {
        console.log("Skipping token refresh - signup in progress");
        return;
      }

      if (fbUser) {
        try {
          // Force refresh token if it's about to expire (within 5 minutes)
          const tokenResult = await fbUser.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;

          if (expirationTime - now < fiveMinutes) {
            // Token is about to expire, force refresh
            const newToken = await fbUser.getIdToken(true);
            localStorage.setItem("token", newToken);
            // Sync with backend
            await loginRef.current(newToken);
          } else {
            // Token changed but not expiring, just update storage
            const token = await fbUser.getIdToken();
            localStorage.setItem("token", token);
          }
        } catch {
          // On refresh failure, logout and redirect with expired flag
          await logout();
          window.location.href = "/sign-in?expired=true";
        }
      }
    });

    return unsubscribe;
  }, [logout]);

  // Periodic token refresh check (every 4 minutes)
  useEffect(() => {
    const intervalId = setInterval(
      async () => {
        const fbUser = firebaseAuth.currentUser;
        if (fbUser) {
          try {
            // This will automatically refresh if token is expired
            await fbUser.getIdToken();
          } catch {
            // Periodic token check failed - session expired
            await logout();
            window.location.href = "/sign-in?expired=true";
          }
        }
      },
      4 * 60 * 1000,
    ); // 4 minutes

    return () => clearInterval(intervalId);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        firebaseUser,
        loading: loading || isLoggingIn,
        logout,
        sessionExpired,
        setSignupInProgress,
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
