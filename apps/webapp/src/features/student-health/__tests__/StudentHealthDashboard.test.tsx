import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudentHealthDashboard } from "../components/StudentHealthDashboard";
import type { StudentHealthCard } from "@workspace/types";

const mockRefetch = vi.fn();
const mockUseHook = vi.fn();

vi.mock("../hooks/use-student-health-dashboard", () => ({
  useStudentHealthDashboard: (...args: unknown[]) => mockUseHook(...args),
}));

const mockUseStudentProfile = vi.fn().mockReturnValue({
  profile: null,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
});

vi.mock("../hooks/use-student-profile", () => ({
  useStudentProfile: (...args: unknown[]) => mockUseStudentProfile(...args),
}));

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ user: { role: "OWNER" }, isLoading: false }),
}));

vi.mock("../hooks/use-intervention", () => ({
  useInterventionHistory: () => ({
    history: [],
    isLoading: false,
  }),
  useInterventionPreview: () => ({
    preview: null,
    isLoading: false,
  }),
  useSendIntervention: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../hooks/use-student-flags", () => ({
  useStudentFlags: () => ({
    flags: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateFlag: () => ({ mutate: vi.fn(), isPending: false }),
  useResolveFlag: () => ({ mutate: vi.fn(), isPending: false }),
}));

const mockSearchParams = vi.fn(() => new URLSearchParams());
vi.mock("react-router", () => ({
  useSearchParams: () => [mockSearchParams()],
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

  it("opens overlay when student card is clicked", async () => {
    const student = makeStudent();
    setupHook({
      students: [student],
      summary: { total: 1, atRisk: 0, warning: 0, onTrack: 1 },
    });
    render(<StudentHealthDashboard />);

    // Initially, useStudentProfile called with null (no student selected)
    expect(mockUseStudentProfile).toHaveBeenCalledWith(null);

    const card = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(card);
    });

    // After clicking, useStudentProfile should be called with the student's ID
    expect(mockUseStudentProfile).toHaveBeenCalledWith("s1");
  });

  it("renders correctly with teacher-scoped data (empty classes)", () => {
    // Teacher scoping is enforced by the backend — the dashboard renders
    // whatever the API returns. Verify it handles teacher-scoped empty data.
    setupHook({
      students: [],
      summary: { total: 0, atRisk: 0, warning: 0, onTrack: 0 },
    });

    render(<StudentHealthDashboard />);

    expect(screen.getByText("Student Health")).toBeInTheDocument();
    expect(
      screen.getByText(/No students enrolled yet/),
    ).toBeInTheDocument();
  });

  it("shows flag icon on student cards with hasOpenFlags", () => {
    const studentWithFlags = makeStudent({
      id: "s-flagged",
      name: "Flagged Student",
      hasOpenFlags: true,
    });
    const studentNoFlags = makeStudent({
      id: "s-clean",
      name: "Clean Student",
      hasOpenFlags: false,
    });
    setupHook({
      students: [studentWithFlags, studentNoFlags],
      summary: { total: 2, atRisk: 0, warning: 0, onTrack: 2 },
    });

    render(<StudentHealthDashboard />);

    // The flagged student card should have a flag icon
    const flagIcons = document.querySelectorAll('[aria-label="Has open flags"]');
    expect(flagIcons).toHaveLength(1);
  });

  it("pre-populates class filter from URL classId search param", () => {
    mockSearchParams.mockReturnValueOnce(new URLSearchParams("classId=c1"));
    const student = makeStudent({ classes: [{ id: "c1", name: "IELTS A" }] });
    setupHook({
      students: [student],
      summary: { total: 1, atRisk: 0, warning: 0, onTrack: 1 },
    });

    render(<StudentHealthDashboard />);

    // The hook should be called with classId from URL
    expect(mockUseHook).toHaveBeenCalledWith(
      expect.objectContaining({ classId: "c1" }),
    );
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
