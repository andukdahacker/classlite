import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router";

import { UsersTable } from "./features/users/components/users-table";
import DashboardLayout from "./features/dashboard/layout";
import LogInPage from "./features/auth/views/login-page";
import SignUpPage from "./features/auth/views/signup-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UnauthorizedError } from "./core/client";
import { toast } from "sonner";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
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
      <BrowserRouter>
        <Routes>
          <Route index path="/sign-in" element={<LogInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index path="users" element={<UsersTable />} />
          </Route>
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export { App };
