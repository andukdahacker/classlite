import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StudentHealthCardComponent } from "../components/StudentHealthCard";
import type { StudentHealthCard } from "@workspace/types";

function makeStudent(
  overrides: Partial<StudentHealthCard> = {},
): StudentHealthCard {
  return {
    id: "s1",
    name: "Alice Smith",
    email: "alice@test.com",
    avatarUrl: null,
    healthStatus: "on-track",
    metrics: {
      attendanceRate: 95,
      attendanceStatus: "on-track",
      totalSessions: 20,
      attendedSessions: 19,
      assignmentCompletionRate: 80,
      assignmentStatus: "on-track",
      totalAssignments: 10,
      completedAssignments: 8,
      overdueAssignments: 0,
    },
    classes: [{ id: "c1", name: "IELTS A" }],
    ...overrides,
  };
}

describe("StudentHealthCard", () => {
  it("renders student name and avatar initials", () => {
    render(<StudentHealthCardComponent student={makeStudent()} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders red border for at-risk status", () => {
    const { container } = render(
      <StudentHealthCardComponent
        student={makeStudent({ healthStatus: "at-risk" })}
      />,
    );
    const card = container.querySelector(".border-l-red-500");
    expect(card).toBeInTheDocument();
  });

  it("renders amber border for warning status", () => {
    const { container } = render(
      <StudentHealthCardComponent
        student={makeStudent({ healthStatus: "warning" })}
      />,
    );
    const card = container.querySelector(".border-l-amber-500");
    expect(card).toBeInTheDocument();
  });

  it("renders emerald border for on-track status", () => {
    const { container } = render(
      <StudentHealthCardComponent
        student={makeStudent({ healthStatus: "on-track" })}
      />,
    );
    const card = container.querySelector(".border-l-emerald-500");
    expect(card).toBeInTheDocument();
  });

  it("renders attendance and assignment metrics", () => {
    render(<StudentHealthCardComponent student={makeStudent()} />);
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });

  it("renders class badges with overflow", () => {
    const student = makeStudent({
      classes: [
        { id: "c1", name: "Class A" },
        { id: "c2", name: "Class B" },
        { id: "c3", name: "Class C" },
        { id: "c4", name: "Class D" },
        { id: "c5", name: "Class E" },
      ],
    });
    render(<StudentHealthCardComponent student={student} />);
    expect(screen.getByText("Class A")).toBeInTheDocument();
    expect(screen.getByText("Class B")).toBeInTheDocument();
    expect(screen.getByText("Class C")).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
    expect(screen.queryByText("Class D")).not.toBeInTheDocument();
  });
});
