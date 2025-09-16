"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import {
  ReadingTFNGTask,
  ReadingYNNGTask,
} from "@/lib/schema/types";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { GripVertical, X } from "lucide-react";
import { useContext, useState } from "react";
import { ReadingComposerContext } from "./reading-composer-context";
import { TaskHeader } from "./task-header";

interface FixedChoiceTaskBuilderProps {
  task: ReadingTFNGTask | ReadingYNNGTask;
  index: number;
  dragHandleProps: any;
  title: "True/False/Not Given" | "Yes/No/Not Given";
  options: ("True" | "False" | "Not Given")[] | ("Yes" | "No" | "Not Given")[];
}

export function FixedChoiceTaskBuilder({
  task,
  index,
  dragHandleProps,
  title,
  options,
}: FixedChoiceTaskBuilderProps) {
  const { editTask, removeTask, duplicateTask } = useContext(
    ReadingComposerContext,
  );
  const [isExpanded, setIsExpanded] = useState(true);

  const handleInstructionChange = (e: any) => {
    editTask(index, { ...task, instruction: e });
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content:
      task.instructions != undefined ? (task.instructions as JSONContent) : "",
    onUpdate: ({ editor }) => {
      handleInstructionChange(editor.getJSON());
    },
    immediatelyRender: false,
  });

  const editQuestionContent = (questionIndex: number, content: string) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    newQuestions[questionIndex].content = content;

    editTask(index, {
      ...task,
      questions: newQuestions,
    });
  };

  const removeQuestion = (questionIndex: number) => {
    const newQuestions = [...task.questions];

    newQuestions.splice(questionIndex, 1);

    const remappedOrder: typeof newQuestions = newQuestions.map((e, i) => {
      return {
        ...e,
        order: i + 1,
      };
    });

    editTask(index, {
      ...task,
      questions: remappedOrder,
    });
  };

  const onDragEndQuestion = (sourceIndex: number, destinationIndex: number) => {
    const newQuestions = [...task.questions];

    const temp = newQuestions[destinationIndex];

    if (!newQuestions[sourceIndex]) return;
    if (!temp) return;

    newQuestions[destinationIndex] = newQuestions[sourceIndex];
    newQuestions[sourceIndex] = temp;

    const remappedOrder: typeof newQuestions = newQuestions.map((e, i) => {
      return {
        ...e,
        order: i + 1,
      };
    });

    editTask(index, {
      ...task,
      questions: remappedOrder,
    });
  };

  const addQuestion = () => {
    const order = task.questions.length + 1;
    editTask(index, {
      ...task,
      questions: [
        ...task.questions,
        {
          order,
          content: `Question ${order}`,
          correctAnswer: options[0],
        },
      ],
    });
  };

  const markCorrect = (questionIndex: number, value: string) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    newQuestions[questionIndex].correctAnswer = value as any;

    editTask(index, { ...task, questions: newQuestions });
  };

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl bg-background">
      <TaskHeader
        title={title}
        isExpanded={isExpanded}
        onExpand={() => setIsExpanded(!isExpanded)}
        onDuplicate={() => duplicateTask(index)}
        onRemove={() => removeTask(index)}
        dragHandleProps={dragHandleProps}
      />
      {isExpanded && (
        <>
          <AppEditor editor={editor} />
          <DragDropContext
            onDragEnd={(result) => {
              const source = result.source.index;
              const destination = result.destination?.index;

              if (destination != undefined) {
                onDragEndQuestion(source, destination);
              }
            }}
          >
            <Droppable droppableId="questions" type="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {task.questions.map((q, qIndex) => (
                    <Draggable
                      key={qIndex}
                      draggableId={`q-${index}-${qIndex}`}
                      index={qIndex}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="rounded-md border p-4 flex flex-col gap-4 mb-4"
                        >
                          <div className="flex justify-between items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab"
                            >
                              <GripVertical />
                            </div>
                            <h4 className="font-semibold">
                              Question {qIndex + 1}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          <Input
                            placeholder="Question"
                            value={q.content}
                            onChange={(e) =>
                              editQuestionContent(qIndex, e.target.value)
                            }
                          />
                          <RadioGroup
                            onValueChange={(v) => markCorrect(qIndex, v)}
                            value={q.correctAnswer}
                            className="flex gap-4"
                          >
                            {options.map((opt) => (
                              <div key={opt} className="flex items-center">
                                <RadioGroupItem
                                  value={opt}
                                  id={`${index}-${qIndex}-${opt}`}
                                />
                                <Label
                                  htmlFor={`${index}-${qIndex}-${opt}`}
                                  className="ml-2"
                                >
                                  {opt}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <Button onClick={addQuestion}>Add Question</Button>
        </>
      )}
    </div>
  );
}
