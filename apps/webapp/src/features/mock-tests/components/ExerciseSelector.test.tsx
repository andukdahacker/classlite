import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import { ExerciseSelector } from "./ExerciseSelector";

// Mock auth context
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { role: "TEACHER", centerId: "center-1", userId: "user-1" },
    loading: false,
  }),
}));

// Mock exercises hook
const mockUseExercises = vi.fn();
vi.mock("@/features/exercises/hooks/use-exercises", () => ({
  useExercises: (...args: unknown[]) => mockUseExercises(...args),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const sampleExercises = [
  {
    id: "ex-1",
    title: "Reading Passage 1",
    skill: "READING",
    status: "PUBLISHED",
    bandLevel: "5.0",
    sections: [
      {
        id: "s1",
        sectionType: "SECTION_1",
        questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
      },
    ],
  },
  {
    id: "ex-2",
    title: "Reading Passage 2",
    skill: "READING",
    status: "PUBLISHED",
    bandLevel: "7.0",
    sections: [
      {
        id: "s2",
        sectionType: "SECTION_1",
        questions: [{ id: "q4" }, { id: "q5" }],
      },
    ],
  },
  {
    id: "ex-3",
    title: "Advanced Reading",
    skill: "READING",
    status: "PUBLISHED",
    bandLevel: null,
    sections: [],
  },
];

describe("ExerciseSelector", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    skill: "READING",
    existingExerciseIds: [] as string[],
    onAdd: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExercises.mockReturnValue({
      exercises: sampleExercises,
      isLoading: false,
    });
  });

  it("renders dialog with skill title", () => {
    render(<ExerciseSelector {...defaultProps} />);

    expect(screen.getByText("Add READING Exercise")).toBeInTheDocument();
  });

  it("renders list of published exercises", () => {
    render(<ExerciseSelector {...defaultProps} />);

    expect(screen.getByText("Reading Passage 1")).toBeInTheDocument();
    expect(screen.getByText("Reading Passage 2")).toBeInTheDocument();
    expect(screen.getByText("Advanced Reading")).toBeInTheDocument();
  });

  it("shows question count for exercises", () => {
    render(<ExerciseSelector {...defaultProps} />);

    expect(screen.getByText("3 questions")).toBeInTheDocument();
    expect(screen.getByText("2 questions")).toBeInTheDocument();
    expect(screen.getByText("0 questions")).toBeInTheDocument();
  });

  it("shows band level badge when available", () => {
    render(<ExerciseSelector {...defaultProps} />);

    expect(screen.getByText("Band 5.0")).toBeInTheDocument();
    expect(screen.getByText("Band 7.0")).toBeInTheDocument();
  });

  it("shows already-added exercises as disabled", () => {
    render(
      <ExerciseSelector {...defaultProps} existingExerciseIds={["ex-1"]} />,
    );

    expect(screen.getByText("Added")).toBeInTheDocument();
    // The "Added" button should be disabled
    const addedButton = screen.getByText("Added").closest("button");
    expect(addedButton).toBeDisabled();
  });

  it("filters exercises by search text", () => {
    render(<ExerciseSelector {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search exercises...");
    fireEvent.change(searchInput, { target: { value: "Advanced" } });

    expect(screen.getByText("Advanced Reading")).toBeInTheDocument();
    expect(screen.queryByText("Reading Passage 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Reading Passage 2")).not.toBeInTheDocument();
  });

  it("calls onAdd when Add button is clicked", () => {
    render(<ExerciseSelector {...defaultProps} />);

    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);

    expect(defaultProps.onAdd).toHaveBeenCalledWith("ex-1");
  });

  it("shows loading spinner when exercises are loading", () => {
    mockUseExercises.mockReturnValue({
      exercises: [],
      isLoading: true,
    });

    render(<ExerciseSelector {...defaultProps} />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows empty state when no exercises match skill", () => {
    mockUseExercises.mockReturnValue({
      exercises: [],
      isLoading: false,
    });

    render(<ExerciseSelector {...defaultProps} />);

    expect(
      screen.getByText("No published reading exercises found."),
    ).toBeInTheDocument();
  });

  it("does not render when dialog is closed", () => {
    render(<ExerciseSelector {...defaultProps} open={false} />);

    expect(screen.queryByText("Add READING Exercise")).not.toBeInTheDocument();
  });
});
