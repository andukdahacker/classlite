import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("@/core/client", () => ({
  default: { GET: (...args: unknown[]) => mockGet(...args) },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-query")>(
      "@tanstack/react-query",
    );
  return actual;
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useStudentHealthDashboard } from "../hooks/use-student-health-dashboard";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStudentHealthDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns students and summary on success", async () => {
    const mockData = {
      data: {
        students: [
          {
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
            classes: [],
          },
        ],
        summary: { total: 1, atRisk: 0, warning: 0, onTrack: 1 },
      },
      message: "ok",
    };
    mockGet.mockResolvedValue({ data: mockData, error: undefined });

    const { result } = renderHook(() => useStudentHealthDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.students).toHaveLength(1);
    expect(result.current.students[0].name).toBe("Alice");
    expect(result.current.summary.onTrack).toBe(1);
  });

  it("returns loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useStudentHealthDashboard(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.students).toEqual([]);
    expect(result.current.summary.total).toBe(0);
  });

  it("returns error state on API failure", async () => {
    mockGet.mockResolvedValue({
      data: undefined,
      error: { message: "Server error" },
    });

    const { result } = renderHook(() => useStudentHealthDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
