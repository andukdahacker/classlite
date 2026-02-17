import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentPopover } from "../components/CommentPopover";

// Mock @workspace/ui components
vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>{children}</button>
  ),
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
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
}));

const defaultProps = {
  position: { x: 100, y: 200 },
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  selectedText: "the students were very engaged",
};

describe("CommentPopover", () => {
  it("renders selected text preview", () => {
    render(<CommentPopover {...defaultProps} />);

    expect(screen.getByText("the students were very engaged")).toBeInTheDocument();
  });

  it("truncates long selected text", () => {
    const longText = "A".repeat(150);
    render(<CommentPopover {...defaultProps} selectedText={longText} />);

    expect(screen.getByText("A".repeat(100) + "...")).toBeInTheDocument();
  });

  it("renders textarea and buttons", () => {
    render(<CommentPopover {...defaultProps} />);

    expect(screen.getByTestId("textarea")).toBeInTheDocument();
    expect(screen.getByText("Comment")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("disables Comment button when content is empty", () => {
    render(<CommentPopover {...defaultProps} />);

    const submitButton = screen.getByText("Comment").closest("button");
    expect(submitButton).toBeDisabled();
  });

  it("calls onSubmit with content and visibility when Comment is clicked", async () => {
    const onSubmit = vi.fn();
    render(<CommentPopover {...defaultProps} onSubmit={onSubmit} />);

    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "Nice work!" } });

    await userEvent.click(screen.getByText("Comment"));

    expect(onSubmit).toHaveBeenCalledWith("Nice work!", "student_facing");
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    render(<CommentPopover {...defaultProps} onCancel={onCancel} />);

    await userEvent.click(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
