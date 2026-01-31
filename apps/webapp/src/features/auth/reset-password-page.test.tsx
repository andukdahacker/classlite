import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { ResetPasswordPage } from "./reset-password-page";

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

vi.mock("@/core/firebase", () => ({
  firebaseAuth: {},
}));

import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

const renderWithRouter = (initialEntry: string) => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/sign-in" element={<div>Sign In Page</div>} />
        <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Token Validation", () => {
    it("shows loading state initially", () => {
      vi.mocked(verifyPasswordResetCode).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      expect(screen.getByText("Validating reset link...")).toBeInTheDocument();
    });

    it("shows error for invalid mode parameter", async () => {
      renderWithRouter("/reset-password?mode=verifyEmail&oobCode=some-code");

      await waitFor(() => {
        expect(screen.getByText("Invalid link")).toBeInTheDocument();
      });
    });

    it("shows error for missing oobCode", async () => {
      renderWithRouter("/reset-password?mode=resetPassword");

      await waitFor(() => {
        expect(screen.getByText("Invalid link")).toBeInTheDocument();
      });
    });

    it("shows expired error for expired token", async () => {
      vi.mocked(verifyPasswordResetCode).mockRejectedValue({
        code: "auth/expired-action-code",
      });

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=expired-code");

      await waitFor(() => {
        expect(screen.getByText("Link expired")).toBeInTheDocument();
        expect(
          screen.getByText(/this link has expired/i)
        ).toBeInTheDocument();
      });
    });

    it("shows invalid error for invalid token", async () => {
      vi.mocked(verifyPasswordResetCode).mockRejectedValue({
        code: "auth/invalid-action-code",
      });

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=invalid-code");

      await waitFor(() => {
        expect(screen.getByText("Invalid link")).toBeInTheDocument();
      });
    });

    it("shows request new link button on error", async () => {
      vi.mocked(verifyPasswordResetCode).mockRejectedValue({
        code: "auth/expired-action-code",
      });

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=expired-code");

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: /request new link/i })
        ).toHaveAttribute("href", "/forgot-password");
      });
    });
  });

  describe("Password Reset Form", () => {
    beforeEach(() => {
      vi.mocked(verifyPasswordResetCode).mockResolvedValue("test@example.com");
    });

    it("shows password form for valid token", async () => {
      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
        expect(screen.getByText("New password")).toBeInTheDocument();
        expect(screen.getByText("Confirm password")).toBeInTheDocument();
      });
    });

    it("validates minimum password length", async () => {
      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "Short1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "Short1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 8 characters")
        ).toBeInTheDocument();
      });
    });

    it("validates uppercase requirement", async () => {
      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "lowercase1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "lowercase1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password must contain at least one uppercase letter")
        ).toBeInTheDocument();
      });
    });

    it("validates number requirement", async () => {
      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "NoNumberHere" } });
      fireEvent.change(passwordInputs[1], { target: { value: "NoNumberHere" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password must contain at least one number")
        ).toBeInTheDocument();
      });
    });

    it("validates password confirmation match", async () => {
      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "DifferentPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
    });

    it("calls confirmPasswordReset on valid submit", async () => {
      vi.mocked(confirmPasswordReset).mockResolvedValue();

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "ValidPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(confirmPasswordReset).toHaveBeenCalledWith(
          expect.anything(),
          "valid-code",
          "ValidPass1"
        );
      });
    });

    it("shows error on confirmPasswordReset failure", async () => {
      vi.mocked(confirmPasswordReset).mockRejectedValue({
        code: "auth/weak-password",
      });

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "ValidPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password is too weak/i)
        ).toBeInTheDocument();
      });
    });

    it("navigates to sign-in on success", async () => {
      vi.mocked(confirmPasswordReset).mockResolvedValue();

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "ValidPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Sign In Page")).toBeInTheDocument();
      });
    });

    it("disables submit button while loading", async () => {
      // Make the promise never resolve to keep loading state
      vi.mocked(confirmPasswordReset).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "ValidPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("toggles password visibility when clicking eye icon", async () => {
      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const toggleButtons = screen.getAllByRole("button", { name: /show password/i });

      // Initially password should be hidden
      expect(passwordInputs[0]).toHaveAttribute("type", "password");

      // Click to show password
      fireEvent.click(toggleButtons[0]);

      await waitFor(() => {
        expect(passwordInputs[0]).toHaveAttribute("type", "text");
      });

      // Click to hide password again
      const hideButton = screen.getAllByRole("button", { name: /hide password/i })[0];
      fireEvent.click(hideButton);

      await waitFor(() => {
        expect(passwordInputs[0]).toHaveAttribute("type", "password");
      });
    });
  });

  describe("Error Messages", () => {
    beforeEach(() => {
      vi.mocked(verifyPasswordResetCode).mockResolvedValue("test@example.com");
    });

    it("shows user-disabled error message", async () => {
      vi.mocked(confirmPasswordReset).mockRejectedValue({
        code: "auth/user-disabled",
      });

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "ValidPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/this account has been disabled/i)
        ).toBeInTheDocument();
      });
    });

    it("shows generic error for unknown error codes", async () => {
      vi.mocked(confirmPasswordReset).mockRejectedValue({
        code: "auth/unknown-error",
      });

      renderWithRouter("/reset-password?mode=resetPassword&oobCode=valid-code");

      await waitFor(() => {
        expect(screen.getByText("Create new password")).toBeInTheDocument();
      });

      const passwordInputs = screen.getAllByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /reset password/i });

      fireEvent.change(passwordInputs[0], { target: { value: "ValidPass1" } });
      fireEvent.change(passwordInputs[1], { target: { value: "ValidPass1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong/i)
        ).toBeInTheDocument();
      });
    });
  });
});
