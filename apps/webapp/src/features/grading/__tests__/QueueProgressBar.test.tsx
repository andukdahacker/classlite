import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock shadcn Progress component
vi.mock("@workspace/ui/components/progress", () => ({
  Progress: ({
    value,
    ...props
  }: {
    value: number;
    className?: string;
  }) => (
    <div
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      {...props}
    />
  ),
}));

import { QueueProgressBar } from "../components/QueueProgressBar";

describe("QueueProgressBar", () => {
  it("renders progress info when progress is not null", () => {
    render(
      <QueueProgressBar
        progress={{ graded: 3, total: 10 }}
        assignmentTitle="IELTS Task 2"
      />,
    );

    expect(screen.getByText(/3 of 10 graded/)).toBeInTheDocument();
    expect(screen.getByText(/IELTS Task 2/)).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toHaveAttribute(
      "aria-valuenow",
      "30",
    );
  });

  it("renders nothing when progress is null", () => {
    const { container } = render(
      <QueueProgressBar progress={null} assignmentTitle={null} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("shows complete state when graded equals total", () => {
    render(
      <QueueProgressBar
        progress={{ graded: 5, total: 5 }}
        assignmentTitle={null}
      />,
    );

    expect(screen.getByText(/5 of 5 graded/)).toBeInTheDocument();
    expect(screen.getByText("Complete!")).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});
