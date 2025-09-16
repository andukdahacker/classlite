"use client";

import { ReadingExerciseTask } from "@workspace/types";
import { FixedChoiceTaskViewer } from "./fixed-choice-task-viewer";
import { MultipleChoiceTaskViewer } from "./multiple-choice-task-viewer";
import { SentenceCompletionTaskViewer } from "./sentence-completion-task-viewer";

interface TaskViewerProps {
  task: ReadingExerciseTask;
}

export function TaskViewer({ task }: TaskViewerProps) {
  switch (task.type) {
    case "Multiple choice":
      return <MultipleChoiceTaskViewer task={task as any} />;
    case "True/False/Not Given":
    case "Yes/No/Not Given":
      return <FixedChoiceTaskViewer task={task as any} />;
    case "Sentence Completion":
      return <SentenceCompletionTaskViewer task={task as any} />;
    default:
      return (
        <div className="rounded-md border p-4">
          Unsupported task type: {task.type}
        </div>
      );
  }
}
