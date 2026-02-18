import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HealthSummaryBar } from "../components/HealthSummaryBar";

const summary = { total: 10, atRisk: 2, warning: 3, onTrack: 5 };

describe("HealthSummaryBar", () => {
  it("renders all 4 metric counts", () => {
    render(
      <HealthSummaryBar summary={summary} isLoading={false} />,
    );
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    const { container } = render(
      <HealthSummaryBar
        summary={{ total: 0, atRisk: 0, warning: 0, onTrack: 0 }}
        isLoading={true}
      />,
    );
    // Skeletons should be present, actual numbers should not
    expect(screen.queryByText("Total Students")).not.toBeInTheDocument();
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("calls onFilterClick when a metric card is clicked", () => {
    const onFilterClick = vi.fn();
    render(
      <HealthSummaryBar
        summary={summary}
        isLoading={false}
        onFilterClick={onFilterClick}
      />,
    );
    // Click the "At Risk" card
    fireEvent.click(screen.getByText("At Risk"));
    expect(onFilterClick).toHaveBeenCalledWith("at-risk");
  });
});
