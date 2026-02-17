import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCommentInput } from "../components/AddCommentInput";

// Mock @workspace/ui components
vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>{children}</button>
  ),
}));

vi.mock("@workspace/ui/components/textarea", () => ({
  Textarea: ({ onChange, onKeyDown, value, ...props }: { onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onKeyDown?: (e: React.KeyboardEvent) => void; value?: string; [key: string]: unknown }) => (
    <textarea
      data-testid="textarea"
      onChange={onChange}
      onKeyDown={onKeyDown}
      value={value}
      {...props}
    />
  ),
}));

vi.mock("lucide-react", () => ({
  Eye: (props: Record<string, unknown>) => <span data-testid="icon-eye" {...props} />,
  EyeOff: (props: Record<string, unknown>) => <span data-testid="icon-eyeoff" {...props} />,
  MessageSquare: (props: Record<string, unknown>) => <span data-testid="icon-message" {...props} />,
}));

describe("AddCommentInput", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  it("renders collapsed placeholder by default", () => {
    render(<AddCommentInput {...defaultProps} />);

    expect(screen.getByText("Add a comment...")).toBeInTheDocument();
  });

  it("expands when placeholder is clicked", async () => {
    render(<AddCommentInput {...defaultProps} />);

    await userEvent.click(screen.getByText("Add a comment..."));

    expect(screen.getByTestId("textarea")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("collapses when Cancel is clicked", async () => {
    render(<AddCommentInput {...defaultProps} />);

    await userEvent.click(screen.getByText("Add a comment..."));
    await userEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("Add a comment...")).toBeInTheDocument();
    expect(screen.queryByTestId("textarea")).not.toBeInTheDocument();
  });

  it("calls onSubmit with content and visibility", async () => {
    const onSubmit = vi.fn();
    render(<AddCommentInput onSubmit={onSubmit} isSubmitting={false} />);

    await userEvent.click(screen.getByText("Add a comment..."));

    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "My comment" } });

    await userEvent.click(screen.getByText("Submit"));

    expect(onSubmit).toHaveBeenCalledWith("My comment", "student_facing");
  });

  it("disables Submit when content is empty", async () => {
    render(<AddCommentInput {...defaultProps} />);

    await userEvent.click(screen.getByText("Add a comment..."));

    const submitButton = screen.getByText("Submit").closest("button");
    expect(submitButton).toBeDisabled();
  });

  it("disables Submit when isSubmitting is true", async () => {
    render(<AddCommentInput onSubmit={vi.fn()} isSubmitting={true} />);

    await userEvent.click(screen.getByText("Add a comment..."));

    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "Content" } });

    const submitButton = screen.getByText("Submit").closest("button");
    expect(submitButton).toBeDisabled();
  });
});
