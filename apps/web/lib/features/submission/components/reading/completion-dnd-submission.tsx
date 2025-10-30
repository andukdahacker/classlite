"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ReadingCompletionTask,
  ReadingSubmissionContent,
} from "@workspace/types";
import { DragEvent, useEffect, useMemo, useState } from "react";

interface CompletionDragAndDropSubmissionProps {
  task: ReadingCompletionTask;
  answers: ReadingSubmissionContent;
  onAnswerChange: (taskIndex: number, questionIndex: number, answer: string | null) => void;
  taskIndex: number;
  isSubmitted: boolean;
  allQuestions: { taskIndex: number, questionIndex: number, questionNumber: number, order: number }[];
}

export function CompletionDragAndDropSubmission({
    task,
    answers,
    onAnswerChange,
    taskIndex,
    isSubmitted,
    allQuestions
}: CompletionDragAndDropSubmissionProps) {
  const currentTaskAnswers = useMemo(() => {
    const taskAnswers: Record<string, string> = {};
    answers.tasks[taskIndex]?.questions.forEach(q => {
      if (q.answer) {
        taskAnswers[q.order] = q.answer;
      }
    });
    return taskAnswers;
  }, [answers, taskIndex]);

  const [options, setOptions] = useState(task.options ?? []);

  useEffect(() => {
    const answeredValues = Object.values(currentTaskAnswers);
    setOptions((prevOptions) => (task.options ?? []).filter(opt => !answeredValues.includes(opt)));
  }, [currentTaskAnswers, task.options]);


  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    item: string,
    source: string, // "options" or "gap-ORDER"
  ) => {
    if (isSubmitted) return;
    e.dataTransfer.setData('text/plain', item);
    e.dataTransfer.setData('source', source);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    targetOrder: string, // gap order or "options"
    isGap: boolean,
  ) => {
    e.preventDefault();
    if (isSubmitted) return;

    const item = e.dataTransfer.getData('text/plain');
    const source = e.dataTransfer.getData('source'); // "options" or "gap-ORDER"

    const getQuestionIndexByOrder = (order: number) => task.questions.findIndex(q => q.order === order);

    if (source === "options") {
        if (!isGap) return; // Can't drop from options to options

        const questionIndex = getQuestionIndexByOrder(Number(targetOrder));
        if (questionIndex === -1) return;

        // If target gap has an item, move it back to options
        const displacedItem = currentTaskAnswers[targetOrder];
        if (displacedItem) {
            setOptions(prev => [...prev, displacedItem]);
        }

        onAnswerChange(taskIndex, questionIndex, item);
        setOptions(prev => prev.filter(opt => opt !== item));

    } else if (source.startsWith('gap-')) {
        const sourceOrder = source.split('-')[1];
        const sourceQuestionIndex = getQuestionIndexByOrder(Number(sourceOrder));
        if (sourceQuestionIndex === -1) return;

        if (isGap) { // Moving from gap to gap
            const targetQuestionIndex = getQuestionIndexByOrder(Number(targetOrder));
            if (targetQuestionIndex === -1) return;

            const displacedItem = currentTaskAnswers[targetOrder];

            // Swap answers
            onAnswerChange(taskIndex, targetQuestionIndex, item);
            onAnswerChange(taskIndex, sourceQuestionIndex, displacedItem || null);

        } else { // Moving from gap to options pool
            onAnswerChange(taskIndex, sourceQuestionIndex, null);
            setOptions(prev => [...prev, item]);
        }
    }
  };

  const contentEditor = useEditor(
    {
      extensions: [
        StarterKit,
        Link,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TableKit,
        Gap.extend({
          addNodeView() {
            return ReactNodeViewRenderer(({ node }) => {
              const gapOrder = String(node.attrs.order);
              const answer = currentTaskAnswers[gapOrder];
              const question = allQuestions.find(q => q.taskIndex === taskIndex && q.order === node.attrs.order);

              return (
                <NodeViewWrapper id={`question-${question?.questionNumber}`} className="inline-block px-1">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, gapOrder, true)}
                    className={`border-2 border-dashed rounded-md min-h-[3.5rem] p-2 min-w-[8rem] flex items-center justify-center bg-muted/20 ${isSubmitted ? "" : "cursor-pointer"}`}
                  >
                    {answer ? (
                      <div
                        draggable={!isSubmitted}
                        onDragStart={(e) => handleDragStart(e, answer, `gap-${gapOrder}`)}
                        className="bg-background border rounded-lg p-2 shadow-sm text-sm w-full text-center"
                      >
                        <span className="text-xs text-muted-foreground font-semibold">
                          {question?.questionNumber}
                        </span>
                        <div className="font-medium">{answer}</div>
                      </div>
                    ) : (
                      <span className="font-semibold text-muted-foreground">
                        {question?.questionNumber}
                      </span>
                    )}
                  </div>
                </NodeViewWrapper>
              );
            });
          },
        }),
      ],
      content: task.content,
      editable: false,
      immediatelyRender: false,
    },
    [currentTaskAnswers, isSubmitted, allQuestions], // Re-render editor when answers change
  );

  return (
    <div className="flex flex-col gap-6">
      <AppEditor editor={contentEditor} showMenu={false} />
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "options", false)}
        className="flex flex-col gap-4 p-4 border rounded-lg min-h-[8rem] bg-muted/30"
      >
        <h4 className="font-semibold">Word Bank</h4>
        <div className="flex gap-2 flex-wrap">
          {options.map((option) => (
            <div
              key={option}
              draggable={!isSubmitted}
              onDragStart={(e) => handleDragStart(e, option, "options")}
              className={`bg-background border rounded-lg px-3 py-1.5 shadow-sm text-sm transition-shadow ${isSubmitted ? "" : "cursor-move hover:shadow-md"}`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
