import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudentHealthDashboard } from "../components/StudentHealthDashboard";
import type { StudentHealthCard } from "@workspace/types";

const mockRefetch = vi.fn();
const mockUseHook = vi.fn();

vi.mock("../hooks/use-student-health-dashboard", () => ({
  useStudentHealthDashboard: (...args: unknown[]) => mockUseHook(...args),
}));

function makeStudent(
  overrides: Partial<StudentHealthCard> = {},
): StudentHealthCard {
  return {
    id: "s1",
    name: "Alice",
    email: null,
    avatarUrl: null,
    healthStatus: "on-track",
    metrics: {
      attendanceRate: 95,
      attendanceStatus: "on-track",
      totalSessions: 10,
      attendedSessions: 10,
      assignmentCompletionRate: 80,
      assignmentStatus: "on-track",
      totalAssignments: 5,
      completedAssignments: 4,
      overdueAssignments: 0,
    },
    classes: [{ id: "c1", name: "IELTS A" }],
    ...overrides,
  };
}

function setupHook(overrides = {}) {
  mockUseHook.mockReturnValue({
    students: [],
    summary: { total: 0, atRisk: 0, warning: 0, onTrack: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    ...overrides,
  });
}

describe("StudentHealthDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading and subtitle", () => {
    setupHook();
    render(<StudentHealthDashboard />);
    expect(screen.getByText("Student Health")).toBeInTheDocument();
    expect(
      screen.getByText("At-a-glance view of student engagement"),
    ).toBeInTheDocument();
  });

  it("shows loading skeletons when loading", () => {
    setupHook({ isLoading: true });
    const { container } = render(<StudentHealthDashboard />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error state with retry button", async () => {
    setupHook({ isError: true });
    render(<StudentHealthDashboard />);
    expect(
      screen.getByText(/Failed to load student health data/),
    ).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: /retry/i });
    await act(async () => {
      fireEvent.click(retryButton);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("shows empty state when no students enrolled", () => {
    setupHook();
    render(<StudentHealthDashboard />);
    expect(
      screen.getByText(/No students enrolled yet/),
    ).toBeInTheDocument();
  });

  it("renders student cards when data is available", () => {
    const student = makeStudent();
    setupHook({
      students: [student],
      summary: { total: 1, atRisk: 0, warning: 0, onTrack: 1 },
    });
    render(<StudentHealthDashboard />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("filters students by status when summary card is clicked", async () => {
    const atRisk = makeStudent({
      id: "s1",
      name: "Alice",
      healthStatus: "at-risk",
    });
    const onTrack = makeStudent({
      id: "s2",
      name: "Bob",
      healthStatus: "on-track",
    });
    setupHook({
      students: [atRisk, onTrack],
      summary: { total: 2, atRisk: 1, warning: 0, onTrack: 1 },
    });
    render(<StudentHealthDashboard />);

    // Both visible initially
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    // Click "At Risk" in summary bar (first match — badge on card is second)
    await act(async () => {
      fireEvent.click(screen.getAllByText("At Risk")[0]);
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    // Click "At Risk" again to toggle off — both visible
    await act(async () => {
      fireEvent.click(screen.getAllByText("At Risk")[0]);
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("debounces search input before calling API", async () => {
    vi.useFakeTimers();
    try {
      setupHook();
      render(<StudentHealthDashboard />);
      const searchInput = screen.getByPlaceholderText("Search by name...");

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Alice" } });
      });

      // Before debounce fires, hook should be called without search
      expect(mockUseHook.mock.lastCall?.[0]).not.toHaveProperty("search");

      // Advance past 300ms debounce
      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      // After debounce fires, hook should be called with search filter
      expect(mockUseHook.mock.lastCall?.[0]).toHaveProperty("search", "Alice");
    } finally {
      vi.useRealTimers();
    }
  });
});
