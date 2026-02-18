import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseTeacherAtRiskWidget = vi.fn();

vi.mock("../hooks/use-teacher-at-risk-widget", () => ({
  useTeacherAtRiskWidget: () => mockUseTeacherAtRiskWidget(),
}));

vi.mock("react-router", () => ({
  useParams: () => ({ centerId: "center-1" }),
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }) => <a href={to}>{children}</a>,
}));

import TeacherAtRiskWidget from "../components/TeacherAtRiskWidget";

describe("TeacherAtRiskWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading and at-risk students", () => {
    mockUseTeacherAtRiskWidget.mockReturnValue({
      widget: {
        students: [
          {
            id: "s1",
            name: "Alice",
            email: null,
            avatarUrl: null,
            healthStatus: "at-risk",
            metrics: {
              attendanceRate: 70,
              attendanceStatus: "at-risk",
              totalSessions: 10,
              attendedSessions: 7,
              assignmentCompletionRate: 40,
              assignmentStatus: "at-risk",
              totalAssignments: 5,
              completedAssignments: 2,
              overdueAssignments: 1,
            },
            classes: [],
          },
        ],
        summary: { total: 5, atRisk: 1, warning: 0, onTrack: 4 },
        classBreakdown: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<TeacherAtRiskWidget />);

    expect(screen.getByText("My Students at Risk")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("70% attendance")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // badge count
  });

  it("shows empty state when all students are on track", () => {
    mockUseTeacherAtRiskWidget.mockReturnValue({
      widget: {
        students: [],
        summary: { total: 5, atRisk: 0, warning: 0, onTrack: 5 },
        classBreakdown: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<TeacherAtRiskWidget />);

    expect(screen.getByText("All students on track")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    mockUseTeacherAtRiskWidget.mockReturnValue({
      widget: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = render(<TeacherAtRiskWidget />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
