import React from "react";
import { useAuth } from "../auth-context";
import type { UserRole } from "@workspace/types";

export interface RBACWrapperProps {
  /**
   * List of roles allowed to access the children.
   */
  requiredRoles: UserRole[];
  /**
   * Mode of access control.
   * - 'hide': (Default) Entirely removes the children from the DOM.
   * - 'disable': Clones the children and injects a `disabled: true` prop.
   */
  mode?: "hide" | "disable";
  /**
   * Children to protect.
   */
  children: React.ReactNode;
  /**
   * Optional fallback content to show while loading.
   */
  fallback?: React.ReactNode;
}

/**
 * Recursively injects disabled prop into children.
 * Handles Fragments by looking into their props.children.
 */
const deepDisable = (children: React.ReactNode): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const typedChild = child as React.ReactElement<Record<string, unknown>>;
    const props: Record<string, unknown> = { disabled: true };

    // If it's a Fragment, we need to recurse into its children
    if (typedChild.type === React.Fragment) {
      return React.cloneElement(typedChild, {
        children: deepDisable(typedChild.props.children),
      });
    }

    // If it has children, we recurse into them as well to ensure deep disable
    // This addresses the "Shallow Disable" issue for nested interactive elements
    if (typedChild.props && typedChild.props.children) {
      props.children = deepDisable(typedChild.props.children);
    }

    return React.cloneElement(typedChild, props);
  });
};

/**
 * Universal RBAC wrapper for UI components.
 * Enforces access control based on user roles provided by the auth context.
 */
export const RBACWrapper: React.FC<RBACWrapperProps> = ({
  requiredRoles,
  mode = "hide",
  children,
  fallback = null,
}) => {
  const { user, loading } = useAuth();

  // Loading Safety: Respect the loading state.
  // Returning fallback (default null) prevents "flicker" of unauthorized content.
  if (loading) {
    return <>{fallback}</>;
  }

  const isAuthorized = !!user && requiredRoles.includes(user.role as UserRole);

  if (isAuthorized) {
    return <>{children}</>;
  }

  // Handle unauthorized state
  if (mode === "hide") {
    return null;
  }

  if (mode === "disable") {
    return <>{deepDisable(children)}</>;
  }

  return null;
};
