import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseStudentProfile = vi.fn();

vi.mock("../hooks/use-student-profile", () => ({
  useStudentProfile: (...args: unknown[]) => mockUseStudentProfile(...args),
}));

import { StudentProfileOverlay } from "../components/StudentProfileOverlay";

function makeProfile() {
  return {
    student: {
      id: "s1",
      name: "Alice Smith",
      email: "alice@test.com",
      avatarUrl: null,
      healthStatus: "on-track" as const,
      metrics: {
        attendanceRate: 95,
        attendanceStatus: "on-track" as const,
        totalSessions: 20,
        attendedSessions: 19,
        assignmentCompletionRate: 80,
        assignmentStatus: "on-track" as const,
        totalAssignments: 10,
        completedAssignments: 8,
        overdueAssignments: 0,
      },
      classes: [{ id: "c1", name: "IELTS A" }],
    },
    attendanceHistory: [
      {
        sessionId: "ses-1",
        className: "IELTS A",
        date: "2026-02-10T10:00:00Z",
        status: "PRESENT",
      },
      {
        sessionId: "ses-2",
        className: "IELTS A",
        date: "2026-02-08T10:00:00Z",
        status: "ABSENT",
      },
    ],
    assignmentHistory: [
      {
        assignmentId: "a1",
        exerciseTitle: "Reading Task 1",
        className: "IELTS A",
        skill: "reading",
        dueDate: "2026-02-15",
        submissionStatus: "graded",
        score: 7.5,
        submittedAt: "2026-02-14T10:00:00Z",
      },
    ],
    weeklyTrends: [
      {
        weekStart: "2026-02-03T00:00:00Z",
        weekLabel: "Feb 3",
        attendanceRate: 100,
        completionRate: 80,
      },
    ],
  };
}

describe("StudentProfileOverlay", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders student name and email when open", () => {
    mockUseStudentProfile.mockReturnValue({
      profile: makeProfile(),
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <StudentProfileOverlay
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
  });

  it("renders tabs with attendance and assignments options", () => {
    mockUseStudentProfile.mockReturnValue({
      profile: makeProfile(),
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <StudentProfileOverlay
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    // All three tabs exist
    expect(screen.getByRole("tab", { name: /trends/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /attendance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /assignments/i }),
    ).toBeInTheDocument();

    // Default tab (Trends) content is visible — verify trend data renders
    const allText = document.body.textContent ?? "";
    expect(allText).toContain("Feb 3");
    expect(allText).toContain("100%");
  });

  it("renders metrics with attendance and assignment data", () => {
    mockUseStudentProfile.mockReturnValue({
      profile: makeProfile(),
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <StudentProfileOverlay
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    // Metrics summary is always visible
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("19/20 sessions")).toBeInTheDocument();
    expect(screen.getAllByText("80%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("8/10 completed")).toBeInTheDocument();
  });

  it("shows root cause alert for at-risk students", () => {
    const profile = makeProfile();
    profile.student.healthStatus = "at-risk";
    profile.student.metrics.attendanceRate = 70;
    profile.student.metrics.attendanceStatus = "at-risk";

    mockUseStudentProfile.mockReturnValue({
      profile,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <StudentProfileOverlay
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Attendance below 80%/)).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    mockUseStudentProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <StudentProfileOverlay
        studentId={null}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("calls refetch when retry button is clicked in error state", () => {
    const mockRefetch = vi.fn();
    mockUseStudentProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      isError: true,
      error: new Error("Failed"),
      refetch: mockRefetch,
    });

    render(
      <StudentProfileOverlay
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    const retryButton = screen.getByRole("button", { name: /retry/i });
    retryButton.click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when Sheet is closed", () => {
    mockUseStudentProfile.mockReturnValue({
      profile: makeProfile(),
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <StudentProfileOverlay
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    // Click the close button (X)
    const closeButton = screen.getByRole("button", { name: /close/i });
    closeButton.click();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
