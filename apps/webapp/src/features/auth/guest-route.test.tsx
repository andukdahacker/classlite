import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestRoute } from "./guest-route";
import * as AuthContextModule from "./auth-context";

// Mock the AuthContext
vi.mock("./auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("GuestRoute", () => {
  const mockUseAuth = AuthContextModule.useAuth as unknown as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <GuestRoute />
      </MemoryRouter>,
    );

    // Look for the loader icon or container
    // Our component renders a div with flex/h-screen and a Loader2 icon
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to default path (root) when user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123", email: "test@example.com", role: "OWNER" },
      firebaseUser: { uid: "fb123" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<GuestRoute />} />
          <Route path="/" element={<div>Dashboard Root</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard Root")).toBeInTheDocument();
  });

  it("redirects to custom path when provided and user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123", email: "test@example.com", role: "OWNER" },
      firebaseUser: { uid: "fb123" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={<GuestRoute redirectTo="/custom-dashboard" />}
          />
          <Route
            path="/custom-dashboard"
            element={<div>Custom Dashboard</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Custom Dashboard")).toBeInTheDocument();
  });

  it("renders children when user is NOT authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <GuestRoute>
          <div>Login Form Content</div>
        </GuestRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Form Content")).toBeInTheDocument();
  });

  it("renders Outlet when user is NOT authenticated and no children provided", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/auth/login"]}>
        <Routes>
          <Route path="/auth" element={<GuestRoute />}>
            <Route path="login" element={<div>Nested Login Route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Nested Login Route")).toBeInTheDocument();
  });
});
