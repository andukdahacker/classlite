import React from "react";
import { Navigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "./auth-context";
import { Loader2 } from "lucide-react";

/**
 * A component that prevents authenticated users from accessing guest-only routes
 * (like login and signup). If a user is authenticated, they are redirected to
 * the original path they were trying to access (via redirect param) or to the
 * root path for role-based redirection.
 */
export const GuestRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo = "/" }) => {
  const { user, firebaseUser, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, they shouldn't be here -> send to original path or root
  if (user || firebaseUser) {
    // Check for redirect param from protected route
    const redirectPath = searchParams.get("redirect");
    if (redirectPath) {
      try {
        const decodedPath = decodeURIComponent(redirectPath);
        // Validate it's a relative path (security: prevent open redirect)
        if (decodedPath.startsWith("/") && !decodedPath.startsWith("//")) {
          return <Navigate to={decodedPath} replace />;
        }
      } catch {
        // Invalid encoding, fall through to default
      }
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Otherwise render the guest content
  return children ? <>{children}</> : <Outlet />;
};
