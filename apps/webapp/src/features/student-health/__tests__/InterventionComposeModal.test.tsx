import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseInterventionPreview = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("../hooks/use-intervention", () => ({
  useInterventionPreview: (...args: unknown[]) =>
    mockUseInterventionPreview(...args),
  useSendIntervention: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

import { InterventionComposeModal } from "../components/InterventionComposeModal";

describe("InterventionComposeModal", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ data: { id: "log-1" } });
  });

  it("renders pre-filled fields from preview", () => {
    mockUseInterventionPreview.mockReturnValue({
      preview: {
        recipientEmail: "parent@test.com",
        subject: "Concern about Alice",
        body: "Dear parent, we noticed...",
        templateUsed: "concern-general",
      },
      isLoading: false,
    });

    render(
      <InterventionComposeModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    const toInput = screen.getByLabelText("To") as HTMLInputElement;
    const subjectInput = screen.getByLabelText("Subject") as HTMLInputElement;
    const bodyInput = screen.getByLabelText("Body") as HTMLTextAreaElement;

    expect(toInput.value).toBe("parent@test.com");
    expect(subjectInput.value).toBe("Concern about Alice");
    expect(bodyInput.value).toBe("Dear parent, we noticed...");
  });

  it("submits form with edited values", async () => {
    mockUseInterventionPreview.mockReturnValue({
      preview: {
        recipientEmail: "parent@test.com",
        subject: "Concern about Alice",
        body: "Dear parent, we noticed...",
        templateUsed: "concern-general",
      },
      isLoading: false,
    });

    render(
      <InterventionComposeModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    // Edit the subject
    const subjectInput = screen.getByLabelText("Subject");
    fireEvent.change(subjectInput, {
      target: { value: "Updated subject" },
    });

    // Click send
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      studentId: "s1",
      recipientEmail: "parent@test.com",
      subject: "Updated subject",
      body: "Dear parent, we noticed...",
      templateUsed: "concern-general",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows loading state while preview is loading", () => {
    mockUseInterventionPreview.mockReturnValue({
      preview: null,
      isLoading: true,
    });

    render(
      <InterventionComposeModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    // Fields should not be rendered while loading
    expect(screen.queryByLabelText("To")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Subject")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Body")).not.toBeInTheDocument();
  });

  it("closes on cancel", () => {
    mockUseInterventionPreview.mockReturnValue({
      preview: {
        recipientEmail: "parent@test.com",
        subject: "Subject",
        body: "Body",
        templateUsed: "concern-general",
      },
      isLoading: false,
    });

    render(
      <InterventionComposeModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables send button when fields are empty", () => {
    mockUseInterventionPreview.mockReturnValue({
      preview: null,
      isLoading: false,
    });

    render(
      <InterventionComposeModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });
});
