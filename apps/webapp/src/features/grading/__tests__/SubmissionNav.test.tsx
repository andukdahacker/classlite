import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled ?? false} {...props}>
      {children}
    </button>
  ),
}));

import { SubmissionNav } from "../components/SubmissionNav";

describe("SubmissionNav", () => {
  const defaultProps = {
    currentIndex: 2,
    total: 10,
    onPrev: vi.fn(),
    onNext: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders position indicator", () => {
    render(<SubmissionNav {...defaultProps} />);
    expect(screen.getByText("3 of 10 submissions")).toBeInTheDocument();
  });

  it("renders prev and next buttons", () => {
    render(<SubmissionNav {...defaultProps} />);
    expect(screen.getByText("Prev")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("calls onPrev when prev button clicked", async () => {
    render(<SubmissionNav {...defaultProps} />);
    await userEvent.click(screen.getByText("Prev"));
    expect(defaultProps.onPrev).toHaveBeenCalledOnce();
  });

  it("calls onNext when next button clicked", async () => {
    render(<SubmissionNav {...defaultProps} />);
    await userEvent.click(screen.getByText("Next"));
    expect(defaultProps.onNext).toHaveBeenCalledOnce();
  });

  it("disables prev button at first item", () => {
    render(<SubmissionNav {...defaultProps} currentIndex={0} />);
    const prevButton = screen.getByText("Prev").closest("button");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button at last item", () => {
    render(<SubmissionNav {...defaultProps} currentIndex={9} />);
    const nextButton = screen.getByText("Next").closest("button");
    expect(nextButton).toBeDisabled();
  });

  it("shows 'No submissions' when total is 0", () => {
    render(<SubmissionNav {...defaultProps} total={0} currentIndex={0} />);
    expect(screen.getByText("No submissions")).toBeInTheDocument();
  });

  it("responds to ArrowRight keyboard shortcut", () => {
    render(<SubmissionNav {...defaultProps} />);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(defaultProps.onNext).toHaveBeenCalledOnce();
  });

  it("responds to ArrowLeft keyboard shortcut", () => {
    render(<SubmissionNav {...defaultProps} />);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(defaultProps.onPrev).toHaveBeenCalledOnce();
  });

  it("does not fire keyboard shortcut when input is focused", () => {
    render(
      <div>
        <input data-testid="text-input" />
        <SubmissionNav {...defaultProps} />
      </div>,
    );

    const input = screen.getByTestId("text-input");
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(defaultProps.onNext).not.toHaveBeenCalled();
  });

  it("cleans up keyboard listener on unmount", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(<SubmissionNav {...defaultProps} />);

    expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
