"use client";

import { ReadingExerciseTask } from "@workspace/types";
import { CompletionTaskViewer } from "./completion-task-viewer";
import { FixedChoiceTaskViewer } from "./fixed-choice-task-viewer";
import { MultipleChoiceTaskViewer } from "./multiple-choice-task-viewer";

interface TaskViewerProps {
  task: ReadingExerciseTask;
}

export function TaskViewer({ task }: TaskViewerProps) {
  switch (task.type) {
    case "Multiple choice":
      return <MultipleChoiceTaskViewer task={task} />;
    case "True/False/Not Given":
    case "Yes/No/Not Given":
      return <FixedChoiceTaskViewer task={task} />;
    case "Completion":
      return <CompletionTaskViewer task={task} />;
    default:
      return (
        <div className="rounded-md border p-4">
          Unsupported task type: {task.type}
        </div>
      );
  }
}
