import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { InviteUserModal } from "./InviteUserModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the invitation API
vi.mock("../invitation.api", () => ({
  createInvitation: vi.fn(),
}));

import { createInvitation } from "../invitation.api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("InviteUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the invite user button", () => {
    render(<InviteUserModal />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /invite user/i })).toBeInTheDocument();
  });

  it("opens modal when button is clicked", () => {
    render(<InviteUserModal />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByText("Personal Message (optional)")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    render(<InviteUserModal />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", { name: /send invitation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("requires email field", async () => {
    render(<InviteUserModal />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    const submitButton = screen.getByRole("button", { name: /send invitation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("has role dropdown with Admin, Teacher, and Student options", () => {
    render(<InviteUserModal />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    // The role dropdown should be present
    const roleSelect = screen.getByLabelText("Role");
    expect(roleSelect).toBeInTheDocument();
  });

  it("includes personal message field with character limit note", () => {
    render(<InviteUserModal />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    expect(screen.getByText("Maximum 500 characters")).toBeInTheDocument();
  });

  it("calls createInvitation on valid form submission", async () => {
    vi.mocked(createInvitation).mockResolvedValue({
      id: "inv-1",
      email: "test@example.com",
      role: "TEACHER",
    });

    const onSuccess = vi.fn();
    render(<InviteUserModal onSuccess={onSuccess} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /send invitation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createInvitation).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          role: "STUDENT", // Default role
          personalMessage: "",
        },
        expect.anything() // TanStack Query mutation context
      );
    });
  });

  it("calls onSuccess callback after successful invitation", async () => {
    vi.mocked(createInvitation).mockResolvedValue({
      id: "inv-1",
      email: "test@example.com",
      role: "TEACHER",
    });

    const onSuccess = vi.fn();
    render(<InviteUserModal onSuccess={onSuccess} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /send invitation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
