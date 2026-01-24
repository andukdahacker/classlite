import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import { ThemeProvider } from "./core/components/common/theme-provider";
import { UnauthorizedError } from "./core/client";
import { AuthProvider } from "./features/auth/auth-context";
import { TenantProvider } from "./features/tenants/tenant-context";
import { ProtectedRoute } from "./features/auth/protected-route";
import { GuestRoute } from "./features/auth/guest-route";
import { RoleRedirect } from "./features/auth/role-redirect";
import { LoginPage } from "./features/auth/login-page";
import { SignupPage } from "./features/auth/signup-page";
import { SignupCenterPage } from "./features/auth/signup-center-page";
import { CenterSettingsPage } from "./features/tenants/center-settings-page";
import { InviteUserModal } from "./features/users/components/InviteUserModal";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof UnauthorizedError) return false;
          return failureCount < 3;
        },
      },
      mutations: {
        retry: 0,
        onError: (error) => {
          if (error instanceof UnauthorizedError) {
            toast.error("Unauthenticated");
          }
        },
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <BrowserRouter>
              <Routes>
                {/* Guest Routes - Redirects to dashboard if logged in */}
                <Route element={<GuestRoute />}>
                  <Route path="/sign-in" element={<LoginPage />} />
                  <Route path="/sign-up" element={<SignupPage />} />
                  <Route
                    path="/sign-up/center"
                    element={<SignupCenterPage />}
                  />
                </Route>

                {/* Role-based redirection at root */}
                <Route path="/" element={<RoleRedirect />} />

                {/* Protected Dashboard Routes */}
                <Route
                  path="/dashboard/owner"
                  element={
                    <ProtectedRoute allowedRoles={["OWNER"]}>
                      <div>Owner Dashboard</div>
                      <InviteUserModal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/owner/settings"
                  element={
                    <ProtectedRoute allowedRoles={["OWNER"]}>
                      <CenterSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/teacher"
                  element={
                    <ProtectedRoute allowedRoles={["TEACHER"]}>
                      <div>Teacher Dashboard</div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/student"
                  element={
                    <ProtectedRoute allowedRoles={["STUDENT"]}>
                      <div>Student Dashboard</div>
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { App };
