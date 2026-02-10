import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignmentCard, formatRelativeDue, formatTimeLimit } from "./AssignmentCard";
import type { StudentAssignment } from "@workspace/types";

const baseAssignment: StudentAssignment = {
  id: "assign-1",
  exerciseId: "ex-1",
  classId: "class-1",
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  timeLimit: 3600,
  instructions: "Complete all reading questions carefully",
  status: "OPEN",
  createdAt: new Date().toISOString(),
  exercise: { id: "ex-1", title: "Reading Comprehension Test", skill: "READING", status: "PUBLISHED" },
  class: { id: "class-1", name: "Class 10A" },
  createdBy: { id: "user-1", name: "Ms. Smith" },
};

describe("AssignmentCard", () => {
  it("renders exercise title", () => {
    render(<AssignmentCard assignment={baseAssignment} />);
    expect(screen.getByText("Reading Comprehension Test")).toBeInTheDocument();
  });

  it("shows class name when class-based assignment", () => {
    render(<AssignmentCard assignment={baseAssignment} />);
    expect(screen.getByText("Class 10A")).toBeInTheDocument();
  });

  it("shows instructions when present", () => {
    render(<AssignmentCard assignment={baseAssignment} />);
    expect(screen.getByText("Complete all reading questions carefully")).toBeInTheDocument();
  });

  it("does not show instructions when absent", () => {
    render(<AssignmentCard assignment={{ ...baseAssignment, instructions: null }} />);
    expect(screen.queryByText("Complete all reading questions carefully")).not.toBeInTheDocument();
  });

  it("does not show class name when individual assignment", () => {
    render(<AssignmentCard assignment={{ ...baseAssignment, class: null, classId: null }} />);
    expect(screen.queryByText("Class 10A")).not.toBeInTheDocument();
  });

  it("Start button is disabled", () => {
    render(<AssignmentCard assignment={baseAssignment} />);
    const startButton = screen.getByRole("button", { name: /Start/i });
    expect(startButton).toBeDisabled();
  });

  it("status badge shows Not Started", () => {
    render(<AssignmentCard assignment={baseAssignment} />);
    expect(screen.getByText(/Not Started/)).toBeInTheDocument();
  });

  it("shows time limit formatted", () => {
    render(<AssignmentCard assignment={baseAssignment} />);
    expect(screen.getByText("1h")).toBeInTheDocument();
  });
});

describe("formatRelativeDue", () => {
  it("returns 'No deadline' for null dueDate", () => {
    expect(formatRelativeDue(null)).toEqual({ text: "No deadline", className: "" });
  });

  it("returns 'Overdue' for past dates", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeDue(yesterday);
    expect(result.text).toBe("Overdue");
    expect(result.className).toContain("text-red-600");
  });

  it("returns 'Due today' for today's date", () => {
    const laterToday = new Date();
    laterToday.setHours(23, 59, 0, 0);
    const result = formatRelativeDue(laterToday.toISOString());
    expect(result.text).toBe("Due today");
    expect(result.className).toContain("text-orange-600");
  });

  it("returns 'Due tomorrow' for next day", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const result = formatRelativeDue(tomorrow.toISOString());
    expect(result.text).toBe("Due tomorrow");
  });

  it("returns formatted date for dates beyond a week", () => {
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeDue(farFuture);
    expect(result.text).not.toContain("Due in");
    expect(result.className).toBe("");
  });
});

describe("formatTimeLimit", () => {
  it("returns dash for null", () => {
    expect(formatTimeLimit(null)).toBe("—");
  });

  it("formats minutes only", () => {
    expect(formatTimeLimit(1800)).toBe("30m");
  });

  it("formats hours only", () => {
    expect(formatTimeLimit(3600)).toBe("1h");
  });

  it("formats hours and minutes", () => {
    expect(formatTimeLimit(5400)).toBe("1h 30m");
  });
});
