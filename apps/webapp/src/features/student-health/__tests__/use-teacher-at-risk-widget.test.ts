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
import { useTeacherAtRiskWidget } from "../hooks/use-teacher-at-risk-widget";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useTeacherAtRiskWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns widget data on success", async () => {
    const mockWidget = {
      students: [
        {
          id: "s1",
          name: "Alice",
          healthStatus: "at-risk",
          metrics: { attendanceRate: 70 },
          classes: [],
        },
      ],
      summary: { total: 5, atRisk: 1, warning: 0, onTrack: 4 },
      classBreakdown: [],
    };
    mockGet.mockResolvedValue({
      data: { data: mockWidget },
      error: undefined,
    });

    const { result } = renderHook(() => useTeacherAtRiskWidget(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.widget).not.toBeNull();
    expect(result.current.widget?.students).toHaveLength(1);
    expect(result.current.widget?.summary.atRisk).toBe(1);
  });

  it("returns loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useTeacherAtRiskWidget(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.widget).toBeNull();
  });
});
