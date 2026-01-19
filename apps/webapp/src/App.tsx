import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { ThemeProvider } from "./core/components/common/theme-provider";
import { UnauthorizedError } from "./core/client";
import { AuthProvider } from "./features/auth/auth-context";
import { ProtectedRoute } from "./features/auth/protected-route";
import { RoleRedirect } from "./features/auth/role-redirect";
import { LoginPage } from "./features/auth/login-page";
import { SignupCenterPage } from "./features/auth/signup-center-page";

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
          <BrowserRouter>
            <Routes>
              <Route path="/sign-in" element={<LoginPage />} />
              <Route path="/sign-up/center" element={<SignupCenterPage />} />

              {/* Role-based redirection at root */}
              <Route path="/" element={<RoleRedirect />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard/owner"
                element={
                  <ProtectedRoute allowedRoles={["OWNER"]}>
                    <div>Owner Dashboard</div>
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
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { App };
