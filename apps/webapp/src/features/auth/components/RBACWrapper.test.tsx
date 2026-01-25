import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RBACWrapper } from "./RBACWrapper";
import { useAuth } from "../auth-context";

// Mock useAuth
vi.mock("../auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("RBACWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when user has required role", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "ADMIN" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]}>
        <div data-testid="child">Visible Content</div>
      </RBACWrapper>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders null when user does not have required role and mode is 'hide' (default)", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "STUDENT" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]}>
        <div data-testid="child">Hidden Content</div>
      </RBACWrapper>,
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders null when loading is true", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "ADMIN" },
      loading: true,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]}>
        <div data-testid="child">Loading...</div>
      </RBACWrapper>,
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("disables child when user does not have required role and mode is 'disable'", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "STUDENT" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]} mode="disable">
        <button data-testid="child">Disabled Button</button>
      </RBACWrapper>,
    );

    const button = screen.getByTestId("child");
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("renders null when user is not logged in", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]}>
        <div data-testid="child">Protected Content</div>
      </RBACWrapper>,
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("works with multiple required roles", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "TEACHER" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN", "TEACHER"]}>
        <div data-testid="child">Visible for Teacher</div>
      </RBACWrapper>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("handles multiple children and non-element children in 'disable' mode", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "STUDENT" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]} mode="disable">
        <button data-testid="button-1">Button 1</button>
        Text Node
        <button data-testid="button-2">Button 2</button>
      </RBACWrapper>,
    );

    expect(screen.getByTestId("button-1")).toBeDisabled();
    expect(screen.getByTestId("button-2")).toBeDisabled();
    expect(screen.getByText(/Text Node/)).toBeInTheDocument();
  });

  it("handles React.Fragment children in 'disable' mode", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "STUDENT" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]} mode="disable">
        <>
          <button data-testid="button-fragment">Fragment Button</button>
        </>
      </RBACWrapper>,
    );

    expect(screen.getByTestId("button-fragment")).toBeDisabled();
  });

  it("handles nested elements in 'disable' mode (Deep Disable)", () => {
    (useAuth as any).mockReturnValue({
      user: { role: "STUDENT" },
      loading: false,
    });

    render(
      <RBACWrapper requiredRoles={["ADMIN"]} mode="disable">
        <div>
          <button data-testid="nested-button">Nested Button</button>
        </div>
      </RBACWrapper>,
    );

    expect(screen.getByTestId("nested-button")).toBeDisabled();
  });
});
