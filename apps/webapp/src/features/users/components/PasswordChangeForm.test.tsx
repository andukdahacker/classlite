import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PasswordChangeForm } from "./PasswordChangeForm";

describe("PasswordChangeForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    hasPassword: true,
  };

  it("renders password form when user has password provider", () => {
    render(<PasswordChangeForm {...defaultProps} />);

    expect(screen.getByText("Current Password")).toBeInTheDocument();
    expect(screen.getByText("New Password")).toBeInTheDocument();
    expect(screen.getByText("Confirm New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
  });

  it("shows Google OAuth message when user has no password provider", () => {
    render(<PasswordChangeForm {...defaultProps} hasPassword={false} />);

    expect(
      screen.getByText(/you signed in with google/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Current Password")
    ).not.toBeInTheDocument();
  });

  it("validates current password is required", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
    });
  });

  it("validates passwords must match", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm {...defaultProps} />);

    const inputs = screen.getAllByPlaceholderText(/password/i);
    await user.type(inputs[0], "oldpass");
    await user.type(inputs[1], "NewPassword1");
    await user.type(inputs[2], "DifferentPassword1");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it("calls onSubmit with valid passwords", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PasswordChangeForm {...defaultProps} onSubmit={onSubmit} />);

    const inputs = screen.getAllByPlaceholderText(/password/i);
    await user.type(inputs[0], "oldpassword");
    await user.type(inputs[1], "NewPassword1");
    await user.type(inputs[2], "NewPassword1");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "oldpassword",
        newPassword: "NewPassword1",
      });
    });
  });

  it("resets form after successful submission", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PasswordChangeForm {...defaultProps} onSubmit={onSubmit} />);

    const inputs = screen.getAllByPlaceholderText(/password/i);
    await user.type(inputs[0], "oldpassword");
    await user.type(inputs[1], "NewPassword1");
    await user.type(inputs[2], "NewPassword1");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(inputs[0]).toHaveValue("");
    });
  });

  it("disables submit button when submitting", () => {
    render(<PasswordChangeForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: /change password/i })).toBeDisabled();
  });

  it("shows loading spinner when submitting", () => {
    render(<PasswordChangeForm {...defaultProps} isSubmitting={true} />);

    const button = screen.getByRole("button", { name: /change password/i });
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("displays password requirements hint", () => {
    render(<PasswordChangeForm {...defaultProps} />);

    expect(
      screen.getByText(/8 characters with 1 uppercase letter and 1 number/i)
    ).toBeInTheDocument();
  });

  it("does not call onSubmit with invalid password format", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PasswordChangeForm {...defaultProps} onSubmit={onSubmit} />);

    const inputs = screen.getAllByPlaceholderText(/password/i);
    await user.type(inputs[0], "oldpass");
    await user.type(inputs[1], "weak"); // Too short, no uppercase, no number
    await user.type(inputs[2], "weak");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    // Wait a bit for any potential async validation
    await new Promise((r) => setTimeout(r, 100));

    // onSubmit should not have been called due to validation failure
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
