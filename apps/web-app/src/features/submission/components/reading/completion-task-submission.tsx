"use client";

import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type {
  ReadingCompletionTask,
  ReadingSubmissionContent,
} from "@workspace/types";
import { GapInputSubmission } from "./gap-input-submission";

import { AppEditor } from "@/core/components/editor/app-editor";
import { Gap } from "@/core/components/editor/extensions/gap";
import { CompletionDragAndDropSubmission } from "./completion-dnd-submission";

interface CompletionTaskSubmissionProps {
  task: ReadingCompletionTask;
  answers: ReadingSubmissionContent;
  onAnswerChange: (
    taskIndex: number,
    questionIndex: number,
    answer: string | null,
  ) => void;
  taskIndex: number;
  isSubmitted: boolean;
  allQuestions: {
    taskIndex: number;
    questionIndex: number;
    questionNumber: number;
    order: number;
  }[];
}

export function CompletionTaskSubmission({
  task,
  answers,
  onAnswerChange,
  taskIndex,
  isSubmitted,
  allQuestions,
}: CompletionTaskSubmissionProps) {
  const instructionEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: task.instructions,
    editable: false,
    immediatelyRender: false,
  });

  const contentEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Gap.extend({
        addNodeView() {
          return ReactNodeViewRenderer((props: any) => {
            const question = allQuestions.find(
              (q) =>
                q.taskIndex === taskIndex && q.order === props.node.attrs.order,
            );
            return (
              <NodeViewWrapper
                id={`question-${question?.questionNumber}`}
                className="inline-block"
              >
                <GapInputSubmission
                  order={props.node.attrs.order}
                  value={
                    answers.tasks[taskIndex]?.questions.find(
                      (q) => q.order === props.node.attrs.order,
                    )?.answer || ""
                  }
                  onChange={(order, value) => {
                    const questionIndex = task.questions.findIndex(
                      (q) => q.order === order,
                    );
                    if (questionIndex !== -1) {
                      onAnswerChange(taskIndex, questionIndex, value);
                    }
                  }}
                  isSubmitted={isSubmitted}
                />
              </NodeViewWrapper>
            );
          });
        },
      }),
      TableKit,
    ],
    content: task.content,
    editable: false,
    immediatelyRender: false,
  });

  if (task.taskType === "DragAndDrop") {
    return (
      <CompletionDragAndDropSubmission
        task={task}
        answers={answers}
        onAnswerChange={onAnswerChange}
        taskIndex={taskIndex}
        isSubmitted={isSubmitted}
        allQuestions={allQuestions}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {task.instructions && <AppEditor editor={instructionEditor} />}
      <AppEditor editor={contentEditor} showMenu={false} />
    </div>
  );
}
