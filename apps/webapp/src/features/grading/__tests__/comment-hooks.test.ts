import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock client
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
vi.mock("@/core/client", () => ({
  default: {
    POST: (...args: unknown[]) => mockPost(...args),
    PATCH: (...args: unknown[]) => mockPatch(...args),
    DELETE: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useCreateComment } from "../hooks/use-create-comment";
import { useUpdateComment } from "../hooks/use-update-comment";
import { useDeleteComment } from "../hooks/use-delete-comment";

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

describe("useCreateComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST with comment body and shows success toast", async () => {
    const mockData = { data: { id: "c-1" }, message: "Created" };
    mockPost.mockResolvedValue({ data: mockData, error: undefined });

    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useCreateComment("sub-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      content: "Nice work!",
      startOffset: 10,
      endOffset: 20,
      visibility: "student_facing",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/comments",
      {
        params: { path: { submissionId: "sub-1" } },
        body: {
          content: "Nice work!",
          startOffset: 10,
          endOffset: 20,
          visibility: "student_facing",
        },
      },
    );
    expect(toast.success).toHaveBeenCalledWith("Comment added");
  });

  it("shows error toast on failure", async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: { message: "Failed" },
    });

    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useCreateComment("sub-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      content: "Test",
      startOffset: null,
      endOffset: null,
      visibility: "student_facing",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to add comment");
  });
});

describe("useUpdateComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls PATCH with comment data", async () => {
    const mockData = { data: { id: "c-1" }, message: "Updated" };
    mockPatch.mockResolvedValue({ data: mockData, error: undefined });

    const { result } = renderHook(
      () => useUpdateComment("sub-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      commentId: "c-1",
      data: { content: "Updated text" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPatch).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/comments/{commentId}",
      {
        params: { path: { submissionId: "sub-1", commentId: "c-1" } },
        body: { content: "Updated text" },
      },
    );
  });

  it("shows error toast on failure", async () => {
    mockPatch.mockResolvedValue({
      data: undefined,
      error: { message: "Failed" },
    });

    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useUpdateComment("sub-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      commentId: "c-1",
      data: { content: "X" },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to update comment");
  });
});

describe("useDeleteComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls DELETE and shows success toast", async () => {
    const mockData = { message: "Deleted" };
    mockDelete.mockResolvedValue({ data: mockData, error: undefined });

    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useDeleteComment("sub-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("c-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDelete).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/comments/{commentId}",
      {
        params: { path: { submissionId: "sub-1", commentId: "c-1" } },
      },
    );
    expect(toast.success).toHaveBeenCalledWith("Comment deleted");
  });

  it("shows error toast on failure", async () => {
    mockDelete.mockResolvedValue({
      data: undefined,
      error: { message: "Failed" },
    });

    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useDeleteComment("sub-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("c-1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to delete comment");
  });
});
