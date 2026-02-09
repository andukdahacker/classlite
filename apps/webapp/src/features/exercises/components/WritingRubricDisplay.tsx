import { WRITING_RUBRIC_CRITERIA } from "@workspace/types";

interface WritingRubricDisplayProps {
  taskType: "W1" | "W2" | "W3";
}

export function WritingRubricDisplay({ taskType }: WritingRubricDisplayProps) {
  const criteria =
    taskType === "W3"
      ? WRITING_RUBRIC_CRITERIA.TASK2
      : WRITING_RUBRIC_CRITERIA.TASK1;

  return (
    <div className="rounded-md border p-4 space-y-3">
      <p className="text-sm font-medium">
        IELTS Writing {taskType === "W3" ? "Task 2" : "Task 1"} — Assessment
        Criteria
      </p>
      <div className="grid grid-cols-2 gap-3">
        {criteria.map((criterion, idx) => (
          <div
            key={idx}
            className="rounded border bg-muted/30 p-3 space-y-1"
          >
            <p className="text-sm font-medium">{criterion}</p>
            <p className="text-xs text-muted-foreground">Band 0 — 9</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        This task is graded using IELTS band descriptors. Actual scoring
        interface is available in the AI Grading Workbench.
      </p>
    </div>
  );
}
