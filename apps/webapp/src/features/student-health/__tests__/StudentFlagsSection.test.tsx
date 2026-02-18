import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseStudentFlags = vi.fn();
const mockResolveFlag = vi.fn();

vi.mock("../hooks/use-student-flags", () => ({
  useStudentFlags: (...args: unknown[]) => mockUseStudentFlags(...args),
  useResolveFlag: () => ({
    mutate: mockResolveFlag,
    isPending: false,
  }),
}));

import { StudentFlagsSection } from "../components/StudentFlagsSection";

function makeFlag(overrides = {}) {
  return {
    id: "f1",
    note: "Frequent absences noticed",
    status: "OPEN",
    createdByName: "Mr. Teacher",
    createdAt: "2026-02-15T10:00:00Z",
    resolvedNote: null,
    ...overrides,
  };
}

describe("StudentFlagsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders open flags with status badges", () => {
    mockUseStudentFlags.mockReturnValue({
      flags: [makeFlag()],
      isLoading: false,
    });

    render(<StudentFlagsSection studentId="s1" isAdmin />);

    expect(screen.getByText("Student Flags (1 open)")).toBeInTheDocument();
    expect(screen.getByText("Frequent absences noticed")).toBeInTheDocument();
    expect(screen.getByText("Mr. Teacher")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
  });

  it("shows resolve button only for admin users", () => {
    mockUseStudentFlags.mockReturnValue({
      flags: [makeFlag()],
      isLoading: false,
    });

    // Admin can resolve
    const { unmount } = render(
      <StudentFlagsSection studentId="s1" isAdmin />,
    );
    expect(
      screen.getByRole("button", { name: /resolve/i }),
    ).toBeInTheDocument();
    unmount();

    // Non-admin cannot resolve
    render(<StudentFlagsSection studentId="s1" />);
    expect(
      screen.queryByRole("button", { name: /resolve/i }),
    ).not.toBeInTheDocument();
  });

  it("returns null when no open flags and not admin", () => {
    mockUseStudentFlags.mockReturnValue({
      flags: [makeFlag({ status: "RESOLVED" })],
      isLoading: false,
    });

    const { container } = render(<StudentFlagsSection studentId="s1" />);
    expect(container.innerHTML).toBe("");
  });
});
