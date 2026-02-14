import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { SubmissionHeader } from "./SubmissionHeader";
import type { SaveStatus } from "../hooks/use-auto-save";

function renderHeader(saveStatus?: SaveStatus) {
  return render(
    <MemoryRouter initialEntries={["/c1/assignments/a1/submit"]}>
      <Routes>
        <Route
          path="/:centerId/assignments/:assignmentId/submit"
          element={
            <SubmissionHeader
              title="Test Assignment"
              currentQuestion={0}
              totalQuestions={5}
              saveStatus={saveStatus}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SubmissionHeader SaveIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when saveStatus is idle", () => {
    renderHeader("idle");
    expect(screen.queryByTestId("save-indicator")).not.toBeInTheDocument();
  });

  it("renders nothing when saveStatus is undefined", () => {
    renderHeader(undefined);
    expect(screen.queryByTestId("save-indicator")).not.toBeInTheDocument();
  });

  it("renders spinning icon when saving", () => {
    renderHeader("saving");
    const indicator = screen.getByTestId("save-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent("Saving...");
    expect(indicator.className).toContain("text-muted-foreground");
  });

  it("renders green check when saved", () => {
    renderHeader("saved");
    const indicator = screen.getByTestId("save-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent("Saved");
    expect(indicator.className).toContain("text-green-600");
  });

  it("renders error state that persists", () => {
    renderHeader("error");
    const indicator = screen.getByTestId("save-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent("Save failed");
    expect(indicator.className).toContain("text-destructive");

    // Error does NOT auto-hide
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();
  });

  it("auto-hides saved indicator after 2 seconds", () => {
    renderHeader("saved");
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("save-indicator")).not.toBeInTheDocument();
  });

  it("renders CloudOff + 'Offline' indicator when offline", () => {
    renderHeader("offline");
    const indicator = screen.getByTestId("save-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent("Offline");
    expect(indicator.className).toContain("text-amber-500");
  });

  it("offline indicator persists (no auto-hide)", () => {
    renderHeader("offline");
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("save-indicator")).toHaveTextContent("Offline");
  });

  it("renders CloudUpload + 'Syncing...' indicator when syncing", () => {
    renderHeader("syncing");
    const indicator = screen.getByTestId("save-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent("Syncing...");
    expect(indicator.className).toContain("text-blue-600");
  });

  it("syncing indicator persists (no auto-hide)", () => {
    renderHeader("syncing");
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("save-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("save-indicator")).toHaveTextContent("Syncing...");
  });

  it("transitions from saving to saved to idle", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/c1/assignments/a1/submit"]}>
        <Routes>
          <Route
            path="/:centerId/assignments/:assignmentId/submit"
            element={
              <SubmissionHeader
                title="Test"
                currentQuestion={0}
                totalQuestions={5}
                saveStatus="saving"
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("save-indicator")).toHaveTextContent("Saving...");

    rerender(
      <MemoryRouter initialEntries={["/c1/assignments/a1/submit"]}>
        <Routes>
          <Route
            path="/:centerId/assignments/:assignmentId/submit"
            element={
              <SubmissionHeader
                title="Test"
                currentQuestion={0}
                totalQuestions={5}
                saveStatus="saved"
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("save-indicator")).toHaveTextContent("Saved");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId("save-indicator")).not.toBeInTheDocument();
  });
});
