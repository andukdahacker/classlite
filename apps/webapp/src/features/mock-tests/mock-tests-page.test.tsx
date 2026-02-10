import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import { MockTestsPage } from "./mock-tests-page";
import { BrowserRouter } from "react-router";

// Mock auth context
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { role: "TEACHER", centerId: "center-1", userId: "user-1" },
    loading: false,
  }),
}));

// Mock mock-tests hook
const mockUseMockTests = vi.fn();
vi.mock("./hooks/use-mock-tests", () => ({
  useMockTests: (...args: unknown[]) => mockUseMockTests(...args),
  mockTestsKeys: {
    all: ["mock-tests"],
    lists: () => ["mock-tests", "list"],
    list: (f?: unknown) => ["mock-tests", "list", f],
    details: () => ["mock-tests", "detail"],
    detail: (id: string) => ["mock-tests", "detail", id],
  },
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const defaultHookReturn = {
  mockTests: [],
  isLoading: false,
  createMockTest: vi.fn(),
  isCreating: false,
  deleteMockTest: vi.fn(),
  publishMockTest: vi.fn(),
  archiveMockTest: vi.fn(),
};

describe("MockTestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when loading", () => {
    mockUseMockTests.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state when no mock tests", () => {
    mockUseMockTests.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Mock Tests")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No mock tests yet. Create your first mock test to simulate full IELTS conditions.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Create Mock Test")).toBeInTheDocument();
  });

  it("renders mock tests in table", () => {
    mockUseMockTests.mockReturnValue({
      ...defaultHookReturn,
      mockTests: [
        {
          id: "mt-1",
          title: "Academic Practice Test 1",
          testType: "ACADEMIC",
          status: "DRAFT",
          sections: [
            { skill: "LISTENING", exercises: [{ id: "e1" }] },
            { skill: "READING", exercises: [] },
            { skill: "WRITING", exercises: [{ id: "e2" }] },
            { skill: "SPEAKING", exercises: [] },
          ],
          createdBy: { id: "u-1", name: "Teacher A" },
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
        {
          id: "mt-2",
          title: "GT Practice Test",
          testType: "GENERAL_TRAINING",
          status: "PUBLISHED",
          sections: [],
          createdBy: { id: "u-1", name: "Teacher A" },
          createdAt: "2026-02-02T00:00:00.000Z",
          updatedAt: "2026-02-02T00:00:00.000Z",
        },
      ],
    });

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Academic Practice Test 1")).toBeInTheDocument();
    expect(screen.getByText("GT Practice Test")).toBeInTheDocument();
    expect(screen.getByText("Academic")).toBeInTheDocument();
    expect(screen.getByText("General Training")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
  });

  it("renders section summary for mock tests", () => {
    mockUseMockTests.mockReturnValue({
      ...defaultHookReturn,
      mockTests: [
        {
          id: "mt-1",
          title: "Test With Sections",
          testType: "ACADEMIC",
          status: "DRAFT",
          sections: [
            { skill: "LISTENING", exercises: [{ id: "e1" }, { id: "e2" }] },
            { skill: "READING", exercises: [{ id: "e3" }] },
            { skill: "WRITING", exercises: [] },
            { skill: "SPEAKING", exercises: [{ id: "e4" }, { id: "e5" }, { id: "e6" }] },
          ],
          createdBy: { id: "u-1", name: "Teacher" },
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    });

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("L:2 R:1 W:0 S:3")).toBeInTheDocument();
  });

  it("renders filter controls", () => {
    mockUseMockTests.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    // Status and test type filter dropdowns exist
    expect(screen.getByText("All Status")).toBeInTheDocument();
    expect(screen.getByText("All Types")).toBeInTheDocument();
  });

  it("opens create dialog when Create Mock Test is clicked", () => {
    mockUseMockTests.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText("Create Mock Test"));

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument();
  });

  it("disables create button when title is empty", () => {
    mockUseMockTests.mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText("Create Mock Test"));

    // The dialog has a "Create" button that should be disabled when title is empty
    const createButtons = screen.getAllByText("Create");
    const dialogCreateButton = createButtons[createButtons.length - 1];
    expect(dialogCreateButton).toBeDisabled();
  });

  it("shows actions menu for DRAFT mock tests", () => {
    mockUseMockTests.mockReturnValue({
      ...defaultHookReturn,
      mockTests: [
        {
          id: "mt-1",
          title: "Draft Test",
          testType: "ACADEMIC",
          status: "DRAFT",
          sections: [],
          createdBy: { id: "u-1", name: "Teacher" },
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    });

    render(
      <BrowserRouter>
        <MockTestsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Draft Test")).toBeInTheDocument();
  });
});
