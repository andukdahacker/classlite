import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ProfileEditForm } from "./ProfileEditForm";
import type { AuthUser } from "@workspace/types";

// Mock the tooltip provider
vi.mock("@workspace/ui/components/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUser: AuthUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  role: "TEACHER",
  centerId: "center-1",
  phoneNumber: "+84123456789",
  preferredLanguage: "en",
  deletionRequestedAt: null,
};

describe("ProfileEditForm", () => {
  const defaultProps = {
    user: mockUser,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isSubmitting: false,
  };

  it("renders with user data pre-filled", () => {
    render(<ProfileEditForm {...defaultProps} />);

    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+84123456789")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("shows email and role as disabled fields", () => {
    render(<ProfileEditForm {...defaultProps} />);

    const emailInput = screen.getByDisplayValue("test@example.com");
    const roleInput = screen.getByDisplayValue("TEACHER");

    expect(emailInput).toBeDisabled();
    expect(roleInput).toBeDisabled();
  });

  it("validates name is required", async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm {...defaultProps} />);

    const nameInput = screen.getByDisplayValue("Test User");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("validates name max length", async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm {...defaultProps} />);

    const nameInput = screen.getByDisplayValue("Test User");
    await user.clear(nameInput);
    await user.type(nameInput, "a".repeat(101));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/100/i)).toBeInTheDocument();
    });
  });

  it("validates phone number max length", async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm {...defaultProps} />);

    const phoneInput = screen.getByDisplayValue("+84123456789");
    await user.clear(phoneInput);
    await user.type(phoneInput, "1".repeat(21));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/20/i)).toBeInTheDocument();
    });
  });

  it("calls onSubmit with form values when valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProfileEditForm {...defaultProps} onSubmit={onSubmit} />);

    const nameInput = screen.getByDisplayValue("Test User");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Name",
          phoneNumber: "+84123456789",
          preferredLanguage: "en",
        })
      );
    });
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ProfileEditForm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("disables submit button when submitting", () => {
    render(<ProfileEditForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows loading spinner when submitting", () => {
    render(<ProfileEditForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: /save changes/i }).querySelector("svg")).toBeInTheDocument();
  });

  it("allows empty phone number", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProfileEditForm {...defaultProps} onSubmit={onSubmit} />);

    const phoneInput = screen.getByDisplayValue("+84123456789");
    await user.clear(phoneInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: undefined,
        })
      );
    });
  });

  it("handles user with no name gracefully", () => {
    const userWithoutName = { ...mockUser, name: null };
    render(<ProfileEditForm {...defaultProps} user={userWithoutName} />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    expect(nameInput).toHaveValue("");
  });
});
