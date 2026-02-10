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
import { TenantProvider } from "./features/tenants/tenant-context";
import { ProfilePage } from "./features/users/profile-page";
import { UsersPage } from "./features/users/users-page";
import { ExercisesPage } from "./features/exercises/exercises-page";
import { ExerciseEditor } from "./features/exercises/components/ExerciseEditor";
import { GradingQueuePage } from "./features/grading/GradingQueuePage";
import { MockTestsPage } from "./features/mock-tests/mock-tests-page";
import { MockTestEditor } from "./features/mock-tests/components/MockTestEditor";
import AssignmentsPage from "./features/assignments/assignments-page";
import { StudentsPage } from "./features/students/StudentsPage";
import { SettingsLayout } from "./features/settings/components/SettingsLayout";
import { GeneralSettingsPage } from "./features/settings/pages/GeneralSettingsPage";
import { IntegrationsPage } from "./features/settings/pages/IntegrationsPage";
import { PrivacyPage } from "./features/settings/pages/PrivacyPage";
import { RoomsPage } from "./features/settings/pages/RoomsPage";
import { TagsSettingsPage } from "./features/settings/pages/TagsSettingsPage";

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
                      allowedRoles={["OWNER", "ADMIN", "TEACHER", "STUDENT"]}
                    >
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                >
                  {/* Redirect old /users route to settings/users */}
                  <Route
                    path="users"
                    element={<Navigate to="settings/users" replace />}
                  />

                  {/* Settings with sub-navigation */}
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                        <SettingsLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<GeneralSettingsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="rooms" element={<RoomsPage />} />
                    <Route path="tags" element={<TagsSettingsPage />} />
                    <Route path="integrations" element={<IntegrationsPage />} />
                    <Route path="privacy" element={<PrivacyPage />} />
                  </Route>

                  {/* Courses - accessed via Classes, kept for direct URL access */}
                  <Route
                    path="courses"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <CoursesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="classes"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <ClassesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="schedule"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER", "STUDENT"]}
                      >
                        <SchedulerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exercises"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <ExercisesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exercises/new"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <ExerciseEditor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="exercises/:id/edit"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <ExerciseEditor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="assignments"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <AssignmentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="mock-tests"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <MockTestsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="mock-tests/new"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <MockTestEditor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="mock-tests/:id/edit"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <MockTestEditor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="grading"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <GradingQueuePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="students"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER"]}
                      >
                        <StudentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute
                        allowedRoles={["OWNER", "ADMIN", "TEACHER", "STUDENT"]}
                      >
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile/:userId"
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
