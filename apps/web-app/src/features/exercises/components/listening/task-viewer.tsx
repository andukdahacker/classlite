'use client';

import { ListeningExerciseTask } from '@workspace/types';
import { useMemo } from 'react';
import { CompletionTaskViewer } from './completion-task-viewer';
import { FixedChoiceTaskViewer } from './fixed-choice-task-viewer';
import { MultipleChoiceTaskViewer } from './multiple-choice-task-viewer';

interface TaskViewerProps {
  task: ListeningExerciseTask;
  tasks: ListeningExerciseTask[];
  index: number;
}

export function TaskViewer({ task, tasks, index }: TaskViewerProps) {
  const questionsBeforeCount = useMemo(
    () =>
      tasks
        .slice(0, index)
        .reduce((total, currentTask) => total + currentTask.questions.length, 0),
    [tasks, index],
  );

  switch (task.type) {
    case 'Multiple choice':
      return (
        <MultipleChoiceTaskViewer
          task={task}
          questionBefore={questionsBeforeCount}
        />
      );
    case 'True/False/Not Given':
    case 'Yes/No/Not Given':
      return (
        <FixedChoiceTaskViewer
          task={task}
          questionBefore={questionsBeforeCount}
        />
      );
    case 'Completion':
      return (
        <CompletionTaskViewer
          task={task}
          questionBefore={questionsBeforeCount}
        />
      );
    default:
      return (
        <div className="rounded-md border p-4">
          Unsupported task type: {task.type}
        </div>
      );
  }
}
