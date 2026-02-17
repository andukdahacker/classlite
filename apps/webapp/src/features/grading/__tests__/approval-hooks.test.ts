import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock client
const mockPatch = vi.fn();
const mockPost = vi.fn();
vi.mock("@/core/client", () => ({
  default: {
    PATCH: (...args: unknown[]) => mockPatch(...args),
    POST: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useApproveFeedbackItem } from "../hooks/use-approve-feedback-item";
import { useBulkApprove } from "../hooks/use-bulk-approve";
import { useFinalizeGrading } from "../hooks/use-finalize-grading";
import { gradingKeys } from "../hooks/grading-keys";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return { queryClient, Wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }};
}

describe("useApproveFeedbackItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls PATCH with item data on approve", async () => {
    const mockData = { data: { id: "item-1", isApproved: true }, message: "Updated" };
    mockPatch.mockResolvedValue({ data: mockData, error: undefined });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useApproveFeedbackItem("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({ itemId: "item-1", data: { isApproved: true } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPatch).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/feedback/items/{itemId}",
      {
        params: { path: { submissionId: "sub-1", itemId: "item-1" } },
        body: { isApproved: true },
      },
    );
  });

  it("optimistically updates cached feedback item", async () => {
    const mockData = { data: { id: "item-1", isApproved: true }, message: "Updated" };
    mockPatch.mockResolvedValue({ data: mockData, error: undefined });

    const { queryClient, Wrapper } = createWrapper();

    // Seed the detail cache with a feedback item
    queryClient.setQueryData(gradingKeys.detail("sub-1"), {
      data: {
        feedback: {
          items: [{ id: "item-1", isApproved: null, approvedAt: null, teacherOverrideText: null }],
        },
      },
    });

    const { result } = renderHook(
      () => useApproveFeedbackItem("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({ itemId: "item-1", data: { isApproved: true } });

    // Optimistic update should apply before server response
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = queryClient.getQueryData(gradingKeys.detail("sub-1")) as any;
      expect(cached.data.feedback.items[0].isApproved).toBe(true);
    });
  });

  it("rolls back optimistic update on error", async () => {
    mockPatch.mockResolvedValue({
      data: undefined,
      error: { message: "Server error" },
    });

    const { toast } = await import("sonner");

    const { queryClient, Wrapper } = createWrapper();

    // Seed the detail cache
    const originalData = {
      data: {
        feedback: {
          items: [{ id: "item-1", isApproved: null, approvedAt: null, teacherOverrideText: null }],
        },
      },
    };
    queryClient.setQueryData(gradingKeys.detail("sub-1"), originalData);

    const { result } = renderHook(
      () => useApproveFeedbackItem("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({ itemId: "item-1", data: { isApproved: true } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache should have been rolled back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = queryClient.getQueryData(gradingKeys.detail("sub-1")) as any;
    expect(cached.data.feedback.items[0].isApproved).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Failed to update feedback item");
  });
});

describe("useBulkApprove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls PATCH bulk endpoint with approve_remaining action", async () => {
    const mockData = { data: { count: 5 }, message: "Approved" };
    mockPatch.mockResolvedValue({ data: mockData, error: undefined });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBulkApprove("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({ action: "approve_remaining" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPatch).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/feedback/items/bulk",
      {
        params: { path: { submissionId: "sub-1" } },
        body: { action: "approve_remaining" },
      },
    );
  });

  it("optimistically updates all pending items to approved", async () => {
    const mockData = { data: { count: 2 }, message: "Approved" };
    mockPatch.mockResolvedValue({ data: mockData, error: undefined });

    const { queryClient, Wrapper } = createWrapper();

    queryClient.setQueryData(gradingKeys.detail("sub-1"), {
      data: {
        feedback: {
          items: [
            { id: "item-1", isApproved: true, approvedAt: "2025-01-01" },
            { id: "item-2", isApproved: null, approvedAt: null },
            { id: "item-3", isApproved: null, approvedAt: null },
          ],
        },
      },
    });

    const { result } = renderHook(
      () => useBulkApprove("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({ action: "approve_remaining" });

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = queryClient.getQueryData(gradingKeys.detail("sub-1")) as any;
      // Already-approved item stays the same
      expect(cached.data.feedback.items[0].isApproved).toBe(true);
      // Pending items now optimistically approved
      expect(cached.data.feedback.items[1].isApproved).toBe(true);
      expect(cached.data.feedback.items[2].isApproved).toBe(true);
    });
  });

  it("shows error toast on failure", async () => {
    mockPatch.mockResolvedValue({
      data: undefined,
      error: { message: "Failed" },
    });

    const { toast } = await import("sonner");

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBulkApprove("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({ action: "approve_remaining" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to update feedback items");
  });
});

describe("useFinalizeGrading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST finalize endpoint with teacher overrides", async () => {
    const mockData = {
      data: { submissionId: "sub-1", status: "GRADED", teacherFinalScore: 7.5, nextSubmissionId: "sub-2" },
      message: "Finalized",
    };
    mockPost.mockResolvedValue({ data: mockData, error: undefined });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useFinalizeGrading("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({
      teacherFinalScore: 7.5,
      teacherCriteriaScores: { taskAchievement: 7.0 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/finalize",
      {
        params: { path: { submissionId: "sub-1" } },
        body: {
          teacherFinalScore: 7.5,
          teacherCriteriaScores: { taskAchievement: 7.0 },
        },
      },
    );
  });

  it("invalidates detail and queue caches on success", async () => {
    const mockData = {
      data: { submissionId: "sub-1", status: "GRADED", teacherFinalScore: 7.0, nextSubmissionId: null },
      message: "Finalized",
    };
    mockPost.mockResolvedValue({ data: mockData, error: undefined });

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useFinalizeGrading("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({});

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: gradingKeys.detail("sub-1") }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: gradingKeys.queue({}) }),
    );
  });

  it("shows error toast on failure", async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: { message: "Failed" },
    });

    const { toast } = await import("sonner");

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useFinalizeGrading("sub-1"),
      { wrapper: Wrapper },
    );

    result.current.mutate({});

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to finalize grading");
  });
});
