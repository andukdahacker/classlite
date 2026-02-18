import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMutate = vi.fn();

vi.mock("../hooks/use-student-flags", () => ({
  useCreateFlag: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

import { FlagStudentModal } from "../components/FlagStudentModal";

describe("FlagStudentModal", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog title and description when open", () => {
    render(
      <FlagStudentModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByText("Flag Student for Admin")).toBeInTheDocument();
    expect(
      screen.getByText(/Describe the concern so admin can follow up/),
    ).toBeInTheDocument();
  });

  it("disables submit when note is too short", () => {
    render(
      <FlagStudentModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /flag student/i });
    expect(submitButton).toBeDisabled();

    // Type a short note (< 10 chars)
    const textarea = screen.getByPlaceholderText(/parent meeting/i);
    fireEvent.change(textarea, { target: { value: "short" } });
    expect(submitButton).toBeDisabled();
  });

  it("calls createFlag when note is valid and submit is clicked", async () => {
    render(
      <FlagStudentModal
        studentId="s1"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    const textarea = screen.getByPlaceholderText(/parent meeting/i);
    const submitButton = screen.getByRole("button", { name: /flag student/i });

    await act(async () => {
      fireEvent.change(textarea, {
        target: { value: "Student has been absent for 3 weeks" },
      });
    });

    expect(submitButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      { studentId: "s1", note: "Student has been absent for 3 weeks" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
