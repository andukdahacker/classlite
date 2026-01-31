import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { ForgotPasswordPage } from "./forgot-password-page";

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/core/firebase", () => ({
  firebaseAuth: {},
}));

import { sendPasswordResetEmail } from "firebase/auth";

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the forgot password form", () => {
    renderWithRouter(<ForgotPasswordPage />);

    expect(screen.getByText("Reset password")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("calls sendPasswordResetEmail on valid submit", async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com"
      );
    });
  });

  it("shows success message after submit regardless of email existence", async () => {
    // Simulate email not found error - should still show success
    vi.mocked(sendPasswordResetEmail).mockRejectedValue(
      new Error("auth/user-not-found")
    );

    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "nonexistent@example.com" } });
    fireEvent.click(submitButton);

    // Should show success message to prevent email enumeration
    await waitFor(() => {
      expect(
        screen.getByText(/if an account exists for this email/i)
      ).toBeInTheDocument();
    });
  });

  it("shows success message on successful submit", async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/if an account exists for this email/i)
      ).toBeInTheDocument();
    });
  });

  it("has back to sign in link", () => {
    renderWithRouter(<ForgotPasswordPage />);

    const backLink = screen.getByText("Back to sign in");
    expect(backLink).toHaveAttribute("href", "/sign-in");
  });

  it("shows validation error for empty email submission", async () => {
    renderWithRouter(<ForgotPasswordPage />);

    const submitButton = screen.getByRole("button", { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("disables submit button while loading", async () => {
    // Make the promise never resolve to keep loading state
    vi.mocked(sendPasswordResetEmail).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
