import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, vi, expect, beforeEach } from "vitest";
import AssignmentsPage from "./assignments-page";
import { BrowserRouter } from "react-router";

// Mock auth context
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { role: "TEACHER", centerId: "center-1", userId: "user-1" },
    loading: false,
  }),
}));

// Mock assignments hook
const mockUseAssignments = vi.fn();
vi.mock("./hooks/use-assignments", () => ({
  useAssignments: (...args: unknown[]) => mockUseAssignments(...args),
  assignmentsKeys: {
    all: ["assignments"],
    lists: () => ["assignments", "list"],
    list: (f?: unknown) => ["assignments", "list", f],
    details: () => ["assignments", "detail"],
    detail: (id: string) => ["assignments", "detail", id],
    counts: () => ["assignments", "counts"],
  },
}));

// Mock child dialogs to simplify tests
vi.mock("./components/create-assignment-dialog", () => ({
  CreateAssignmentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-dialog">Create Assignment Dialog</div> : null,
}));

vi.mock("./components/edit-assignment-dialog", () => ({
  EditAssignmentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-dialog">Edit Assignment Dialog</div> : null,
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

const defaultHookReturn = {
  assignments: [],
  isLoading: false,
  createAssignment: vi.fn(),
  isCreating: false,
  updateAssignment: vi.fn(),
  isUpdating: false,
  closeAssignment: vi.fn(),
  isClosing: false,
  reopenAssignment: vi.fn(),
  isReopening: false,
  archiveAssignment: vi.fn(),
  isArchiving: false,
  deleteAssignment: vi.fn(),
  isDeleting: false,
};

const makeAssignment = (overrides: Record<string, unknown> = {}) => ({
  id: "a-1",
  centerId: "center-1",
  exerciseId: "ex-1",
  classId: "cls-1",
  dueDate: "2026-03-01T10:00:00.000Z",
  timeLimit: 3600,
  instructions: null,
  status: "OPEN",
  createdById: "user-1",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  exercise: { id: "ex-1", title: "Reading Passage 1", skill: "READING", status: "PUBLISHED" },
  class: { id: "cls-1", name: "Class 10A" },
  createdBy: { id: "user-1", name: "Teacher A" },
  _count: { studentAssignments: 5 },
  ...overrides,
});

describe("AssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when loading", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state when no assignments", () => {
    mockUseAssignments.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Assignments")).toBeInTheDocument();
    expect(
      screen.getByText('No assignments yet. Click "Assign Exercise" to create one.'),
    ).toBeInTheDocument();
    expect(screen.getByText("Assign Exercise")).toBeInTheDocument();
  });

  it("renders assignment data in table with correct columns", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [
        makeAssignment(),
        makeAssignment({
          id: "a-2",
          exerciseId: "ex-2",
          classId: "cls-2",
          dueDate: null,
          timeLimit: null,
          status: "CLOSED",
          exercise: { id: "ex-2", title: "Listening Practice", skill: "LISTENING", status: "PUBLISHED" },
          class: { id: "cls-2", name: "Class 11B" },
          _count: { studentAssignments: 3 },
        }),
      ],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    // Column headers
    expect(screen.getByText("Exercise")).toBeInTheDocument();
    expect(screen.getByText("Skill")).toBeInTheDocument();
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("Due Date")).toBeInTheDocument();
    expect(screen.getByText("Time Limit")).toBeInTheDocument();
    expect(screen.getByText("Submissions")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    // First assignment data
    expect(screen.getByText("Reading Passage 1")).toBeInTheDocument();
    expect(screen.getByText("READING")).toBeInTheDocument();
    expect(screen.getByText("Class 10A")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    expect(screen.getByText("1h")).toBeInTheDocument();
    expect(screen.getByText("0/5")).toBeInTheDocument();

    // Second assignment data
    expect(screen.getByText("Listening Practice")).toBeInTheDocument();
    expect(screen.getByText("Class 11B")).toBeInTheDocument();
    expect(screen.getByText("CLOSED")).toBeInTheDocument();
    expect(screen.getByText("No deadline")).toBeInTheDocument();
    expect(screen.getByText("0/3")).toBeInTheDocument();
  });

  it("displays individual assignment when classId is null", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [
        makeAssignment({ classId: null, class: null }),
      ],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Individual")).toBeInTheDocument();
  });

  it("shows overdue indicator for past due date on OPEN assignments", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [
        makeAssignment({ dueDate: "2020-01-01T00:00:00.000Z" }),
      ],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows submissions column in 0/N format", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [
        makeAssignment({ _count: { studentAssignments: 12 } }),
      ],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("0/12")).toBeInTheDocument();
  });

  it("renders filter controls", () => {
    mockUseAssignments.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByPlaceholderText("Search by exercise title...")).toBeInTheDocument();
    expect(screen.getByText("All Statuses")).toBeInTheDocument();
    expect(screen.getByText("All Classes")).toBeInTheDocument();
    expect(screen.getByText("All Skills")).toBeInTheDocument();
  });

  it("filters assignments by search query on exercise title", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [
        makeAssignment(),
        makeAssignment({
          id: "a-2",
          exercise: { id: "ex-2", title: "Writing Task 2", skill: "WRITING", status: "PUBLISHED" },
        }),
      ],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    // Both visible initially
    expect(screen.getByText("Reading Passage 1")).toBeInTheDocument();
    expect(screen.getByText("Writing Task 2")).toBeInTheDocument();

    // Search by title
    fireEvent.change(screen.getByPlaceholderText("Search by exercise title..."), {
      target: { value: "Writing" },
    });

    expect(screen.queryByText("Reading Passage 1")).not.toBeInTheDocument();
    expect(screen.getByText("Writing Task 2")).toBeInTheDocument();
  });

  it("opens create dialog when Assign Exercise button is clicked", () => {
    mockUseAssignments.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.queryByTestId("create-dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Assign Exercise"));

    expect(screen.getByTestId("create-dialog")).toBeInTheDocument();
  });

  it("shows no-match message when search yields no results", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [makeAssignment()],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Search by exercise title..."), {
      target: { value: "nonexistent" },
    });

    expect(screen.getByText("No assignments match your filters.")).toBeInTheDocument();
  });

  it("renders pagination when assignments exceed page size", () => {
    const manyAssignments = Array.from({ length: 25 }, (_, i) =>
      makeAssignment({
        id: `a-${i}`,
        exercise: { id: `ex-${i}`, title: `Exercise ${i}`, skill: "READING", status: "PUBLISHED" },
      }),
    );

    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: manyAssignments,
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Exercise 0")).toBeInTheDocument();
    // Exercise 20 should be on page 1 (index 0-19)
    expect(screen.queryByText("Exercise 20")).not.toBeInTheDocument();
  });

  it("does not render pagination when assignments fit in one page", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [makeAssignment()],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it("shows Close action only for OPEN assignments", async () => {
    const user = userEvent.setup();
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [makeAssignment({ status: "OPEN" })],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    // Open dropdown menu
    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Reopen")).not.toBeInTheDocument();
  });

  it("shows Reopen action for CLOSED assignments and hides Close", async () => {
    const user = userEvent.setup();
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [makeAssignment({ status: "CLOSED" })],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByText("Reopen")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });

  it("shows only Reopen and Delete for ARCHIVED assignments", async () => {
    const user = userEvent.setup();
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [makeAssignment({ status: "ARCHIVED" })],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByText("Reopen")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
  });

  it("shows time limit formatted correctly", () => {
    mockUseAssignments.mockReturnValue({
      ...defaultHookReturn,
      assignments: [
        makeAssignment({ timeLimit: 1800 }), // 30 minutes
      ],
    });

    render(
      <BrowserRouter>
        <AssignmentsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("30m")).toBeInTheDocument();
  });
});
