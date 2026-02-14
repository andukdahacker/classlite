import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

// --- Module mocks ---

const mockStartMutate = vi.fn();
vi.mock("../hooks/use-start-submission", () => ({
  useStartSubmission: () => ({ mutate: mockStartMutate, isPending: false }),
}));

const mockSaveMutate = vi.fn();
const mockSaveMutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock("../hooks/use-save-answers", () => ({
  useSaveAnswers: () => ({
    mutate: mockSaveMutate,
    mutateAsync: mockSaveMutateAsync,
  }),
}));

vi.mock("../hooks/use-submit-submission", () => ({
  useSubmitSubmission: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("../hooks/use-upload-photo", () => ({
  useUploadPhoto: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined) }),
}));

const mockUseAutoSave = vi.fn();
vi.mock("../hooks/use-auto-save", () => ({
  useAutoSave: (...args: unknown[]) => mockUseAutoSave(...args),
}));

const mockLoadLocal = vi.fn();
const mockClearLocal = vi.fn();
vi.mock("../lib/submission-storage", () => ({
  loadAnswersLocal: (...args: unknown[]) => mockLoadLocal(...args),
  clearAnswersLocal: (...args: unknown[]) => mockClearLocal(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../hooks/use-assignment-detail", () => ({
  useAssignmentDetail: () => ({
    data: {
      data: {
        exercise: {
          title: "Test Exercise",
          skill: "READING",
          timeLimit: null,
          autoSubmitOnExpiry: false,
          passageContent: null,
          audioUrl: null,
          sections: [
            {
              sectionType: "R1_MULTIPLE_CHOICE",
              instructions: "Choose one",
              questions: [
                { id: "q1", questionText: "Question 1?", options: ["A", "B"], wordLimit: null },
                { id: "q2", questionText: "Question 2?", options: ["C", "D"], wordLimit: null },
              ],
            },
          ],
        },
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

// --- Imports (after mocks) ---

import { SubmissionPage } from "./SubmissionPage";

// --- Helpers ---

const lastServerSaveRef = { current: 0 };

function renderSubmissionPage() {
  return render(
    <MemoryRouter initialEntries={["/c1/assignments/a1/submit"]}>
      <Routes>
        <Route
          path="/:centerId/assignments/:assignmentId/submit"
          element={<SubmissionPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
  lastServerSaveRef.current = 0;
  mockLoadLocal.mockResolvedValue(undefined);
  mockClearLocal.mockResolvedValue(undefined);
  mockSaveMutateAsync.mockResolvedValue(undefined);

  mockUseAutoSave.mockReturnValue({
    saveStatus: "idle",
    lastSavedAt: null,
    lastServerSaveTimestamp: lastServerSaveRef,
    clearLocal: vi.fn().mockResolvedValue(undefined),
    storageAvailable: true,
  });

  mockStartMutate.mockImplementation(
    (_: unknown, options?: { onSuccess?: (data: unknown) => void }) => {
      options?.onSuccess?.({
        data: {
          id: "sub-1",
          startedAt: new Date().toISOString(),
          answers: [],
        },
      });
    },
  );
});

describe("SubmissionPage", () => {
  describe("Task 6.3: IndexedDB restore and merge with server answers", () => {
    it("calls loadAnswersLocal with centerId and assignmentId after submission starts", async () => {
      renderSubmissionPage();

      await waitFor(() => {
        expect(mockLoadLocal).toHaveBeenCalledWith("c1", "a1");
      });
    });

    it("merges local answers over server-seeded answers (local wins)", async () => {
      mockStartMutate.mockImplementation(
        (_: unknown, options?: { onSuccess?: (data: unknown) => void }) => {
          options?.onSuccess?.({
            data: {
              id: "sub-1",
              startedAt: new Date().toISOString(),
              answers: [{ questionId: "q1", answer: { text: "server" } }],
            },
          });
        },
      );

      mockLoadLocal.mockResolvedValue({
        centerId: "c1",
        assignmentId: "a1",
        submissionId: "sub-1",
        answers: { q1: { text: "local-override" }, q2: { text: "local-only" } },
        savedAt: Date.now(),
      });

      renderSubmissionPage();

      await waitFor(() => {
        expect(mockLoadLocal).toHaveBeenCalledWith("c1", "a1");
      });

      // After merge: q2 should be answered (from local), so pill 2 gets answered style
      await waitFor(() => {
        const pill2 = screen.getByRole("button", { name: "2" });
        expect(pill2.className).toContain("bg-primary/20");
      });
    });
  });

  describe("Task 6.7: save-on-navigate skips when server saved recently", () => {
    it("skips server save when lastServerSaveTimestamp < 1s ago", async () => {
      mockStartMutate.mockImplementation(
        (_: unknown, options?: { onSuccess?: (data: unknown) => void }) => {
          options?.onSuccess?.({
            data: {
              id: "sub-1",
              startedAt: new Date().toISOString(),
              answers: [{ questionId: "q1", answer: { text: "answer" } }],
            },
          });
        },
      );

      // Server saved just now
      lastServerSaveRef.current = Date.now();

      const user = userEvent.setup();
      renderSubmissionPage();

      await waitFor(() => {
        expect(mockStartMutate).toHaveBeenCalled();
      });

      // Navigate to next question — triggers save-on-navigate effect
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // save-on-navigate should be skipped because server saved < 1s ago
      expect(mockSaveMutate).not.toHaveBeenCalled();
    });
  });

  describe("Task 6.8: integration — auto-save active", () => {
    it("renders with auto-save and passes correct params to useAutoSave", async () => {
      renderSubmissionPage();

      await waitFor(() => {
        expect(mockStartMutate).toHaveBeenCalled();
      });

      expect(mockUseAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          centerId: "c1",
          assignmentId: "a1",
          submissionId: "sub-1",
          enabled: true,
        }),
      );

      expect(screen.getByText("Test Exercise")).toBeInTheDocument();
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });
  });
});
