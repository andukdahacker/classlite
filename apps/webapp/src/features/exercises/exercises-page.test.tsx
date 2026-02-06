import { render, screen } from "@testing-library/react";
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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("ExercisesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when loading", () => {
    mockUseExercises.mockReturnValue({
      exercises: [],
      isLoading: true,
      deleteExercise: vi.fn(),
      isDeleting: false,
      publishExercise: vi.fn(),
      archiveExercise: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state when no exercises", () => {
    mockUseExercises.mockReturnValue({
      exercises: [],
      isLoading: false,
      deleteExercise: vi.fn(),
      isDeleting: false,
      publishExercise: vi.fn(),
      archiveExercise: vi.fn(),
    });

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

  it("renders exercises in table", () => {
    mockUseExercises.mockReturnValue({
      exercises: [
        {
          id: "ex-1",
          title: "Reading Test 1",
          skill: "READING",
          status: "DRAFT",
          sections: [{ id: "s-1" }],
          updatedAt: "2026-02-01T00:00:00.000Z",
          createdBy: { id: "u-1", name: "Teacher" },
        },
        {
          id: "ex-2",
          title: "Listening Practice",
          skill: "LISTENING",
          status: "PUBLISHED",
          sections: [],
          updatedAt: "2026-02-02T00:00:00.000Z",
          createdBy: { id: "u-1", name: "Teacher" },
        },
      ],
      isLoading: false,
      deleteExercise: vi.fn(),
      isDeleting: false,
      publishExercise: vi.fn(),
      archiveExercise: vi.fn(),
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

  it("renders filter controls", () => {
    mockUseExercises.mockReturnValue({
      exercises: [],
      isLoading: false,
      deleteExercise: vi.fn(),
      isDeleting: false,
      publishExercise: vi.fn(),
      archiveExercise: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ExercisesPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByPlaceholderText("Search exercises..."),
    ).toBeInTheDocument();
  });
});
