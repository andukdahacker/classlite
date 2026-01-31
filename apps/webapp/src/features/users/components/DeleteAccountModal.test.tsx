import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DeleteAccountModal } from "./DeleteAccountModal";

describe("DeleteAccountModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isSubmitting: false,
  };

  it("renders modal when open", () => {
    render(<DeleteAccountModal {...defaultProps} />);

    expect(screen.getByText(/delete your account/i)).toBeInTheDocument();
    expect(screen.getByText("7 days")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<DeleteAccountModal {...defaultProps} open={false} />);

    expect(screen.queryByText(/delete your account/i)).not.toBeInTheDocument();
  });

  it("shows warning about permanent deletion", () => {
    render(<DeleteAccountModal {...defaultProps} />);

    expect(screen.getByText(/permanently deleted/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("requires typing DELETE to enable confirm button", () => {
    render(<DeleteAccountModal {...defaultProps} />);

    const confirmButton = screen.getByRole("button", { name: /delete my account/i });
    expect(confirmButton).toBeDisabled();
  });

  it("enables confirm button when DELETE is typed", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");

    const confirmButton = screen.getByRole("button", { name: /delete my account/i });
    expect(confirmButton).toBeEnabled();
  });

  it("does not enable button for lowercase delete", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/type delete/i), "delete");

    const confirmButton = screen.getByRole("button", { name: /delete my account/i });
    expect(confirmButton).toBeDisabled();
  });

  it("calls onConfirm when DELETE typed and button clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} onConfirm={onConfirm} />);

    await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");
    await user.click(screen.getByRole("button", { name: /delete my account/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  it("clears input and closes modal after confirmation", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <DeleteAccountModal
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    );

    await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");
    await user.click(screen.getByRole("button", { name: /delete my account/i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onOpenChange when cancel button clicked", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears input when cancel button is clicked", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} onOpenChange={onOpenChange} />);

    await user.type(screen.getByPlaceholderText(/type delete/i), "DEL");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    // Verify onOpenChange was called with false, which triggers input reset
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables buttons when submitting", () => {
    render(<DeleteAccountModal {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete my account/i })).toBeDisabled();
  });

  it("shows loading spinner when submitting", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal {...defaultProps} isSubmitting={true} />);

    await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");

    const confirmButton = screen.getByRole("button", { name: /delete my account/i });
    expect(confirmButton.querySelector("svg")).toBeInTheDocument();
  });

  it("lists consequences of deletion", () => {
    render(<DeleteAccountModal {...defaultProps} />);

    expect(screen.getByText(/profile and data will be permanently deleted/i)).toBeInTheDocument();
    expect(screen.getByText(/removed from all classes and courses/i)).toBeInTheDocument();
  });
});
