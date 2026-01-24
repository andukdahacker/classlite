import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "./auth-context";
import { Loader2 } from "lucide-react";

/**
 * A component that prevents authenticated users from accessing guest-only routes
 * (like login and signup). If a user is authenticated, they are redirected to
 * the root path, which will then handle role-based redirection.
 */
export const GuestRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo = "/" }) => {
  const { user, firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, they shouldn't be here -> send to root (or specified path) for redirection
  if (user || firebaseUser) {
    return <Navigate to={redirectTo} replace />;
  }

  // Otherwise render the guest content
  return children ? <>{children}</> : <Outlet />;
};
