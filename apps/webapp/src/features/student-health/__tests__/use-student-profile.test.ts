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
import { useStudentProfile } from "../hooks/use-student-profile";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStudentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile data on success", async () => {
    const mockProfile = {
      student: {
        id: "s1",
        name: "Alice",
        email: "alice@test.com",
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
      attendanceHistory: [],
      assignmentHistory: [],
      weeklyTrends: [],
    };
    mockGet.mockResolvedValue({
      data: { data: mockProfile, message: "ok" },
      error: undefined,
    });

    const { result } = renderHook(() => useStudentProfile("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).not.toBeNull();
    expect(result.current.profile?.student.name).toBe("Alice");
  });

  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentProfile(null), {
      wrapper: createWrapper(),
    });

    // Should not have called the API
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
  });

  it("returns error state on API failure", async () => {
    mockGet.mockResolvedValue({
      data: undefined,
      error: { message: "Server error" },
    });

    const { result } = renderHook(() => useStudentProfile("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
