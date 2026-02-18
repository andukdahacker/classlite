import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();

vi.mock("@/core/client", () => ({
  default: {
    GET: (...args: unknown[]) => mockGet(...args),
    POST: (...args: unknown[]) => mockPost(...args),
    PATCH: (...args: unknown[]) => mockPatch(...args),
  },
}));

import {
  useStudentFlags,
  useCreateFlag,
  useResolveFlag,
} from "../hooks/use-student-flags";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("useStudentFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches flags for a student", async () => {
    const flags = [
      {
        id: "flag-1",
        studentId: "s1",
        centerId: "c1",
        createdById: "t1",
        createdByName: "Teacher",
        note: "Needs help",
        status: "OPEN",
        resolvedById: null,
        resolvedByName: null,
        resolvedNote: null,
        createdAt: "2026-02-18T10:00:00Z",
        resolvedAt: null,
      },
    ];
    mockGet.mockResolvedValue({ data: { data: flags }, error: null });

    const { result } = renderHook(() => useStudentFlags("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.flags).toHaveLength(1);
    expect(result.current.flags[0].id).toBe("flag-1");
  });

  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useStudentFlags(null), {
      wrapper: createWrapper(),
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.flags).toEqual([]);
  });

  it("returns empty array on error", async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const { result } = renderHook(() => useStudentFlags("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.flags).toEqual([]);
  });
});

describe("useCreateFlag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST with correct payload", async () => {
    mockPost.mockResolvedValue({
      data: { data: { flagId: "flag-1", status: "OPEN" } },
      error: null,
    });

    const { result } = renderHook(() => useCreateFlag("s1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ studentId: "s1", note: "Needs attention urgently" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith(
      "/api/v1/student-health/flags",
      expect.objectContaining({
        body: { studentId: "s1", note: "Needs attention urgently" },
      }),
    );
  });
});

describe("useResolveFlag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls PATCH with correct payload", async () => {
    mockPatch.mockResolvedValue({
      data: { data: { flagId: "flag-1", status: "RESOLVED" } },
      error: null,
    });

    const { result } = renderHook(() => useResolveFlag("s1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      flagId: "flag-1",
      resolvedNote: "Issue addressed",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPatch).toHaveBeenCalledWith(
      "/api/v1/student-health/flags/{flagId}/resolve",
      expect.objectContaining({
        params: { path: { flagId: "flag-1" } },
        body: { resolvedNote: "Issue addressed" },
      }),
    );
  });
});
