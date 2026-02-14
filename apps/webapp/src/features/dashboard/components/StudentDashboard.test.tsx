import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import StudentDashboard from "./StudentDashboard";
import { useAuth } from "@/features/auth/auth-context";
import { useStudentAssignments } from "../hooks/use-student-assignments";
import type { StudentAssignment } from "@workspace/types";

vi.mock("@/features/auth/auth-context");
vi.mock("../hooks/use-student-assignments");

// Mock scrollIntoView for Radix UI components
Element.prototype.scrollIntoView = vi.fn();

const mockAssignment = (overrides: Partial<StudentAssignment> = {}): StudentAssignment => ({
  id: "assign-1",
  exerciseId: "ex-1",
  classId: "class-1",
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  timeLimit: 3600,
  instructions: "Complete all questions",
  status: "OPEN",
  createdAt: new Date().toISOString(),
  exercise: { id: "ex-1", title: "Reading Test 1", skill: "READING", status: "PUBLISHED" },
  class: { id: "class-1", name: "Class 10A" },
  createdBy: { id: "user-1", name: "Teacher" },
  ...overrides,
});

describe("StudentDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { role: "STUDENT", centerId: "center-1" },
      loading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it("renders loading skeleton while data is fetching", () => {
    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [],
      isLoading: true,
      isError: false,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    // Skeleton elements should be present (no heading visible yet)
    expect(screen.queryByText("Your Tasks")).not.toBeInTheDocument();
  });

  it("renders error state when API call fails", () => {
    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [],
      isLoading: false,
      isError: true,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    expect(screen.getByText("Failed to load assignments")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("renders empty state when no assignments", () => {
    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [],
      isLoading: false,
      isError: false,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    expect(screen.getByText("Your Tasks")).toBeInTheDocument();
    expect(screen.getByText("No assignments")).toBeInTheDocument();
    expect(screen.getByText(/You don't have any assignments/)).toBeInTheDocument();
  });

  it("groups assignments into urgency sections", () => {
    const overdueAssignment = mockAssignment({
      id: "overdue-1",
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
      exercise: { id: "ex-2", title: "Overdue Exercise", skill: "WRITING", status: "PUBLISHED" },
    });

    const upcomingAssignment = mockAssignment({
      id: "upcoming-1",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      exercise: { id: "ex-3", title: "Upcoming Exercise", skill: "LISTENING", status: "PUBLISHED" },
    });

    const noDeadlineAssignment = mockAssignment({
      id: "nodeadline-1",
      dueDate: null,
      exercise: { id: "ex-4", title: "No Deadline Exercise", skill: "SPEAKING", status: "PUBLISHED" },
    });

    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [overdueAssignment, upcomingAssignment, noDeadlineAssignment],
      isLoading: false,
      isError: false,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    // Section headings include count
    const overdueHeading = screen.getByText(/Overdue \(1\)/);
    expect(overdueHeading).toBeInTheDocument();
    expect(overdueHeading).toHaveClass("text-red-600");
    expect(screen.getByText("Overdue Exercise")).toBeInTheDocument();
    expect(screen.getByText(/Upcoming \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Upcoming Exercise")).toBeInTheDocument();
    expect(screen.getByText(/No Deadline \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("No Deadline Exercise")).toBeInTheDocument();
  });

  it("renders assignment cards with exercise title and skill icon", () => {
    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [mockAssignment()],
      isLoading: false,
      isError: false,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    expect(screen.getByText("Reading Test 1")).toBeInTheDocument();
  });

  it("only renders sections that have assignments", () => {
    // Only one upcoming assignment - no overdue, no today, etc.
    const upcomingAssignment = mockAssignment({
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [upcomingAssignment],
      isLoading: false,
      isError: false,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    expect(screen.getByText(/Upcoming \(1\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Overdue \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Due Today \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No Deadline \(/)).not.toBeInTheDocument();
  });

  it("passes filters to useStudentAssignments hook", () => {
    vi.mocked(useStudentAssignments).mockReturnValue({
      assignments: [],
      isLoading: false,
      isError: false,
    });

    render(<MemoryRouter><StudentDashboard /></MemoryRouter>);

    // Default filters: status OPEN
    expect(useStudentAssignments).toHaveBeenCalledWith(
      "center-1",
      { status: "OPEN" },
    );
  });
});
