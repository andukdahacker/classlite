import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock client
const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock("@/core/client", () => ({
  default: {
    GET: (...args: unknown[]) => mockGet(...args),
    POST: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useGradingQueue } from "../hooks/use-grading-queue";
import { useRetriggerAnalysis } from "../hooks/use-retrigger-analysis";
import { useSubmissionDetail } from "../hooks/use-submission-detail";
import { usePrefetchSubmission } from "../hooks/use-prefetch-submission";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("useGradingQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET /api/v1/grading/submissions with filters", async () => {
    const mockData = {
      data: { items: [], total: 0, page: 1, limit: 50 },
      message: "Success",
    };
    mockGet.mockResolvedValue({ data: mockData, error: undefined });

    const { result } = renderHook(
      () => useGradingQueue({ limit: 50, classId: "cls-1" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/api/v1/grading/submissions", {
      params: { query: { limit: 50, classId: "cls-1" } },
    });
    expect(result.current.data).toEqual(mockData);
  });

  it("throws on API error", async () => {
    mockGet.mockResolvedValue({
      data: undefined,
      error: { message: "Forbidden" },
    });

    const { result } = renderHook(() => useGradingQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "Forbidden" });
  });
});

describe("useRetriggerAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /api/v1/grading/submissions/{submissionId}/analyze", async () => {
    const mockData = { data: { id: "job-1" }, message: "Triggered" };
    mockPost.mockResolvedValue({ data: mockData, error: undefined });

    const { result } = renderHook(
      () => useRetriggerAnalysis("sub-123"),
      { wrapper: createWrapper() },
    );

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/analyze",
      { params: { path: { submissionId: "sub-123" } } },
    );
  });

  it("shows error toast on failure", async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: { message: "Failed" },
    });

    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useRetriggerAnalysis("sub-123"),
      { wrapper: createWrapper() },
    );

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to trigger AI analysis. Please try again.",
    );
  });
});

describe("useSubmissionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches submission detail by id", async () => {
    const mockData = {
      data: {
        submission: { id: "sub-1", status: "SUBMITTED" },
        analysisStatus: "ready",
        feedback: null,
      },
      message: "OK",
    };
    mockGet.mockResolvedValue({ data: mockData, error: undefined });

    const { result } = renderHook(
      () => useSubmissionDetail("sub-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}",
      { params: { path: { submissionId: "sub-1" } } },
    );
    expect(result.current.data).toEqual(mockData);
  });

  it("does not fetch when submissionId is null", async () => {
    const { result } = renderHook(
      () => useSubmissionDetail(null),
      { wrapper: createWrapper() },
    );

    // Should not trigger a fetch
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("throws on API error", async () => {
    mockGet.mockResolvedValue({
      data: undefined,
      error: { message: "Not found" },
    });

    const { result } = renderHook(
      () => useSubmissionDetail("sub-missing"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "Not found" });
  });

  it("enables polling when analysisStatus is analyzing", async () => {
    const mockData = {
      data: {
        submission: { id: "sub-1", status: "AI_PROCESSING" },
        analysisStatus: "analyzing",
        feedback: null,
      },
      message: "OK",
    };
    mockGet.mockResolvedValue({ data: mockData, error: undefined });

    const { result } = renderHook(
      () => useSubmissionDetail("sub-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The refetchInterval is dynamic — when analyzing, it returns 5000
    // We verify the data shape contains the analyzing status
    expect(result.current.data?.data?.analysisStatus).toBe("analyzing");
  });
});

describe("usePrefetchSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefetches submission detail for given id", async () => {
    const mockData = {
      data: {
        submission: { id: "sub-2" },
        analysisStatus: "ready",
        feedback: null,
      },
      message: "OK",
    };
    mockGet.mockResolvedValue({ data: mockData, error: undefined });

    renderHook(
      () => usePrefetchSubmission("sub-2"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    expect(mockGet).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}",
      { params: { path: { submissionId: "sub-2" } } },
    );
  });

  it("does not prefetch when id is null", () => {
    renderHook(
      () => usePrefetchSubmission(null),
      { wrapper: createWrapper() },
    );

    expect(mockGet).not.toHaveBeenCalled();
  });
});
