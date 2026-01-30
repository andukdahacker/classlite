import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./auth-context.js";
import type { UserRole } from "@workspace/types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Capture current path as redirect query param for post-login navigation
    const currentPath = location.pathname + location.search;
    const redirectParam = encodeURIComponent(currentPath);
    return (
      <Navigate
        to={`/sign-in?redirect=${redirectParam}`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they don't have access to this specific route
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
