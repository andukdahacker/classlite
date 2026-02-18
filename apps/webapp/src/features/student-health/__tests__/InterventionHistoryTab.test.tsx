import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseInterventionHistory = vi.fn();

vi.mock("../hooks/use-intervention", () => ({
  useInterventionHistory: (...args: unknown[]) =>
    mockUseInterventionHistory(...args),
}));

import { InterventionHistoryTab } from "../components/InterventionHistoryTab";

describe("InterventionHistoryTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders intervention history list", () => {
    mockUseInterventionHistory.mockReturnValue({
      history: [
        {
          id: "int-1",
          recipientEmail: "parent@test.com",
          subject: "Concern about Alice",
          status: "SENT",
          sentAt: "2026-02-15T10:00:00Z",
        },
        {
          id: "int-2",
          recipientEmail: "parent2@test.com",
          subject: "Follow-up on Bob",
          status: "PENDING",
          sentAt: "2026-02-16T10:00:00Z",
        },
      ],
      isLoading: false,
    });

    render(<InterventionHistoryTab studentId="s1" />);

    expect(screen.getByText("Concern about Alice")).toBeInTheDocument();
    expect(screen.getByText("parent@test.com")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();

    expect(screen.getByText("Follow-up on Bob")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders empty state when no interventions", () => {
    mockUseInterventionHistory.mockReturnValue({
      history: [],
      isLoading: false,
    });

    render(<InterventionHistoryTab studentId="s1" />);

    expect(screen.getByText("No interventions yet")).toBeInTheDocument();
  });

  it("renders loading skeletons", () => {
    mockUseInterventionHistory.mockReturnValue({
      history: [],
      isLoading: true,
    });

    const { container } = render(<InterventionHistoryTab studentId="s1" />);

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
