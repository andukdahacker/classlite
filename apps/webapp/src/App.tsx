import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import { UnauthorizedError } from "./core/client";
import { ThemeProvider } from "./core/components/common/theme-provider";
import { AuthProvider } from "./features/auth/auth-context";
import { ForgotPasswordPage } from "./features/auth/forgot-password-page";
import { GuestRoute } from "./features/auth/guest-route";
import { LoginPage } from "./features/auth/login-page";
import { ProtectedRoute } from "./features/auth/protected-route";
import { ResetPasswordPage } from "./features/auth/reset-password-page";
import { RoleRedirect } from "./features/auth/role-redirect";
import { SignupCenterPage } from "./features/auth/signup-center-page";
import { SignupPage } from "./features/auth/signup-page";
import DashboardPage from "./features/dashboard/DashboardPage";
import { ClassesPage } from "./features/logistics/classes-page";
import { CoursesPage } from "./features/logistics/courses-page";
import { SchedulerPage } from "./features/logistics/scheduler-page";
import { CenterSettingsPage } from "./features/tenants/center-settings-page";
import { TenantProvider } from "./features/tenants/tenant-context";
import { ProfilePage } from "./features/users/profile-page";
import { UsersPage } from "./features/users/users-page";

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
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                </Route>

                {/* Role-based redirection at root */}
                <Route path="/" element={<RoleRedirect />} />

                {/* Unified Dashboard Route */}
                <Route
                  path="/:centerId/dashboard"
                  element={
                    <ProtectedRoute
                      allowedRoles={["OWNER", "TEACHER", "STUDENT"]}
                    >
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/:centerId/dashboard/settings"
                    element={
                      <ProtectedRoute allowedRoles={["OWNER"]}>
                        <CenterSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:centerId/dashboard/users"
                    element={
                      <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:centerId/dashboard/courses"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <CoursesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:centerId/dashboard/classes"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <ClassesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:centerId/dashboard/schedule"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER", "STUDENT"]}
                      >
                        <SchedulerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:centerId/dashboard/profile"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER", "STUDENT"]}
                      >
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:centerId/dashboard/profile/:userId"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER", "STUDENT"]}
                      >
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route path="/dashboard" element={<RoleRedirect />} />

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
