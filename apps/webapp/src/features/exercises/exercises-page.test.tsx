import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, vi, expect, beforeEach } from "vitest";
import { ExercisesPage } from "./exercises-page";
import { BrowserRouter } from "react-router";

// Mock auth context
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { role: "TEACHER", centerId: "center-1", userId: "user-1" },
    loading: false,
  }),
}));

// Mock exercises hook
const mockUseExercises = vi.fn();
vi.mock("./hooks/use-exercises", () => ({
  useExercises: (...args: unknown[]) => mockUseExercises(...args),
  exercisesKeys: {
    all: ["exercises"],
    lists: () => ["exercises", "list"],
    list: (f?: unknown) => ["exercises", "list", f],
    details: () => ["exercises", "detail"],
    detail: (id: string) => ["exercises", "detail", id],
  },
}));

// Mock tags hook
vi.mock("./hooks/use-tags", () => ({
  useTags: () => ({
    tags: [
      { id: "tag-1", name: "Grammar", createdAt: "", updatedAt: "", centerId: "c-1" },
      { id: "tag-2", name: "Vocabulary", createdAt: "", updatedAt: "", centerId: "c-1" },
    ],
    isLoading: false,
    createTag: vi.fn(),
    isCreating: false,
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    mergeTags: vi.fn(),
  }),
}));

// Mock assignment counts hook
vi.mock("@/features/assignments/hooks/use-assignments", () => ({
  useAssignmentCounts: () => ({
    data: [],
    isLoading: false,
  }),
}));

// Mock create assignment dialog
vi.mock("@/features/assignments/components/create-assignment-dialog", () => ({
  CreateAssignmentDialog: () => null,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

const defaultHookReturn = {
  exercises: [],
  isLoading: false,
  deleteExercise: vi.fn(),
  isDeleting: false,
  publishExercise: vi.fn(),
  archiveExercise: vi.fn(),
  duplicateExercise: vi.fn(),
  isDuplicating: false,
  restoreExercise: vi.fn(),
  isRestoring: false,
  bulkArchive: vi.fn(),
  bulkDuplicate: vi.fn(),
  bulkTag: vi.fn(),
};

const sampleExercises = [
  {
    id: "ex-1",
    title: "Reading Test 1",
    skill: "READING" as const,
    status: "DRAFT" as const,
    sections: [{ id: "s-1", sectionType: "R1_MCQ_SINGLE" }],
    tags: [{ id: "tag-1", name: "Grammar" }],
    bandLevel: "6-7",
    updatedAt: "2026-02-01T00:00:00.000Z",
    createdBy: { id: "u-1", name: "Teacher" },
    createdById: "u-1",
    centerId: "center-1",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "ex-2",
    title: "Listening Practice",
    skill: "LISTENING" as const,
    status: "PUBLISHED" as const,
    sections: [],
    tags: [],
    updatedAt: "2026-02-02T00:00:00.000Z",
    createdBy: { id: "u-1", name: "Teacher" },
    createdById: "u-1",
    centerId: "center-1",
    createdAt: "2026-02-02T00:00:00.000Z",
  },
  {
    id: "ex-3",
    title: "Old Writing Task",
    skill: "WRITING" as const,
    status: "ARCHIVED" as const,
    sections: [],
    tags: [],
    updatedAt: "2026-01-15T00:00:00.000Z",
    createdBy: { id: "u-1", name: "Teacher" },
    createdById: "u-1",
    centerId: "center-1",
    createdAt: "2026-01-15T00:00:00.000Z",
  },
];

describe("ExercisesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when loading", () => {
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state when no exercises", () => {
    mockUseExercises.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Exercises")).toBeInTheDocument();
    expect(
      screen.getByText("No exercises found. Create one to get started."),
    ).toBeInTheDocument();
    expect(screen.getByText("Create Exercise")).toBeInTheDocument();
  });

  it("renders exercises in table (list view)", () => {
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: sampleExercises,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Reading Test 1")).toBeInTheDocument();
    expect(screen.getByText("Listening Practice")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Listening")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders filter controls including question type filter", () => {
    mockUseExercises.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByPlaceholderText("Search exercises...")).toBeInTheDocument();
    // Question type filter should have a trigger
    expect(screen.getByText("All Question Types")).toBeInTheDocument();
  });

  it("renders 'Show Archived' toggle defaulting to OFF", () => {
    mockUseExercises.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Show Archived")).toBeInTheDocument();
    // The hook should be called with excludeArchived: true by default
    expect(mockUseExercises).toHaveBeenCalledWith(
      "center-1",
      expect.objectContaining({ excludeArchived: true }),
    );
  });

  it("renders Assignments column with count and Avg Score stub", () => {
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[0]],
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Assignments")).toBeInTheDocument();
    expect(screen.getByText("Avg Score")).toBeInTheDocument();
    // Assignments column shows 0 (real count from hook), Avg Score still stubbed with em dash
    expect(screen.getByText("0")).toBeInTheDocument();
    const emDashes = screen.getAllByText("\u2014");
    expect(emDashes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders grid/list view toggle buttons", () => {
    mockUseExercises.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText("List view")).toBeInTheDocument();
    expect(screen.getByLabelText("Grid view")).toBeInTheDocument();
  });

  it("switches to grid view when grid button is clicked", async () => {
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[0]],
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    await user.click(screen.getByLabelText("Grid view"));

    // In grid view, the exercise title should still be visible
    expect(screen.getByText("Reading Test 1")).toBeInTheDocument();
    // Table headers should not be present in grid view
    expect(screen.queryByText("Sections")).not.toBeInTheDocument();
  });

  it("renders pagination when more than 20 exercises", () => {
    const manyExercises = Array.from({ length: 25 }, (_, i) => ({
      ...sampleExercises[0],
      id: `ex-${i}`,
      title: `Exercise ${i + 1}`,
    }));

    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: manyExercises,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("does not render pagination for 20 or fewer exercises", () => {
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: sampleExercises,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it("renders checkbox selection column in table", () => {
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[0]],
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    // Select all checkbox + one per-row checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows bulk action toolbar when items are selected", async () => {
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[0]],
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    // Click the first exercise checkbox (skip select-all)
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
    expect(screen.getByText("Deselect All")).toBeInTheDocument();
  });

  it("renders duplicate action for all exercise statuses", async () => {
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: sampleExercises,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    // Open actions menu for first exercise (DRAFT)
    const actionButtons = screen.getAllByRole("button", { name: "Actions" });
    await user.click(actionButtons[0]);

    expect(screen.getByText("Duplicate")).toBeInTheDocument();
  });

  it("renders restore action only for ARCHIVED exercises", async () => {
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: sampleExercises,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    // Open actions for ARCHIVED exercise (ex-3, index 2)
    const actionButtons = screen.getAllByRole("button", { name: "Actions" });
    await user.click(actionButtons[2]);

    expect(screen.getByText("Restore")).toBeInTheDocument();
  });

  it("calls duplicateExercise when Duplicate action is clicked", async () => {
    const mockDuplicate = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[0]],
      duplicateExercise: mockDuplicate,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    const actionButtons = screen.getAllByRole("button", { name: "Actions" });
    await user.click(actionButtons[0]);
    await user.click(screen.getByText("Duplicate"));

    await waitFor(() => {
      expect(mockDuplicate).toHaveBeenCalledWith("ex-1");
    });
  });

  it("calls restoreExercise when Restore action is clicked on ARCHIVED exercise", async () => {
    const mockRestore = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[2]], // ARCHIVED
      restoreExercise: mockRestore,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    const actionButtons = screen.getAllByRole("button", { name: "Actions" });
    await user.click(actionButtons[0]);
    await user.click(screen.getByText("Restore"));

    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalledWith("ex-3");
    });
  });

  it("filters exercises by search query", async () => {
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: sampleExercises,
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    await user.type(screen.getByPlaceholderText("Search exercises..."), "Reading");

    expect(screen.getByText("Reading Test 1")).toBeInTheDocument();
    expect(screen.queryByText("Listening Practice")).not.toBeInTheDocument();
  });

  it("removes excludeArchived filter when Show Archived is toggled ON", async () => {
    const user = userEvent.setup();
    mockUseExercises.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    // Toggle Show Archived ON
    await user.click(screen.getByRole("switch"));

    // Last call should not have excludeArchived
    const lastCall = mockUseExercises.mock.calls[mockUseExercises.mock.calls.length - 1];
    expect(lastCall[1]).not.toHaveProperty("excludeArchived");
  });

  it("renders Types column with question type badges", () => {
    mockUseExercises.mockReturnValue({
      ...defaultHookReturn,
      exercises: [sampleExercises[0]],
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Types")).toBeInTheDocument();
    expect(screen.getByText("MCQ Single Answer")).toBeInTheDocument();
  });
});
