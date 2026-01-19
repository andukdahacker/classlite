import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "./auth-context.js";
import { getDashboardPath } from "./auth.utils.js";
import { Loader2 } from "lucide-react";

/**
 * A component that redirects the user to their appropriate dashboard
 * based on their role.
 */
export const RoleRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Navigate to={getDashboardPath(user)} replace />;
};
