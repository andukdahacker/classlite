import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { ThemeProvider } from "./core/components/common/theme-provider";
import { UnauthorizedError } from "./core/client";

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
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="*" element={<Navigate to="/sign-in" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export { App };