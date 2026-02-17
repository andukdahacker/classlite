import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { StampedAnimation } from "../components/StampedAnimation";

vi.mock("lucide-react", () => ({
  CheckCircle2: (props: Record<string, unknown>) => <span data-testid="check-icon" {...props} />,
}));

describe("StampedAnimation", () => {
  it("renders when visible", () => {
    render(<StampedAnimation isVisible={true} onComplete={vi.fn()} />);
    expect(screen.getByText("Graded!")).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  it("calls onComplete after timeout", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<StampedAnimation isVisible={true} onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not render when not visible", () => {
    render(<StampedAnimation isVisible={false} onComplete={vi.fn()} />);
    expect(screen.queryByText("Graded!")).not.toBeInTheDocument();
  });
});
