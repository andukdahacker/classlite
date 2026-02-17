import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BreatherCard } from "../components/BreatherCard";

vi.mock("lucide-react", () => ({
  Coffee: (props: Record<string, unknown>) => <span data-testid="coffee-icon" {...props} />,
}));

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));

describe("BreatherCard", () => {
  const baseProps = {
    sessionGradedCount: 5,
    sessionApprovedCount: 20,
    sessionRejectedCount: 3,
    sessionStartTime: Date.now() - 300000, // 5 minutes ago
    onContinue: vi.fn(),
  };

  it("shows session stats", () => {
    render(<BreatherCard {...baseProps} />);

    expect(screen.getByText("Take a Breather")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // graded count
    expect(screen.getByText("20")).toBeInTheDocument(); // approved count
    expect(screen.getByText("3")).toBeInTheDocument(); // rejected count
  });

  it("calls onContinue when button is clicked", () => {
    const onContinue = vi.fn();
    render(<BreatherCard {...baseProps} onContinue={onContinue} />);

    fireEvent.click(screen.getByText("Continue Grading"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
