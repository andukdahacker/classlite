"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { ReadingMultipleChoiceTask } from "@/lib/schema/types";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { ChevronDown, ChevronUp, Copy, GripVertical, X } from "lucide-react";
import { useContext, useState } from "react";
import { ReadingComposerContext } from "./reading-composer-context";

interface MultipleChoiceTaskBuilderProps {
  task: ReadingMultipleChoiceTask;
  index: number;
  dragHandleProps: any;
}

export function MultipleChoiceTaskBuilder({
  task,
  index,
  dragHandleProps,
}: MultipleChoiceTaskBuilderProps) {
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

    editTask<ReadingMultipleChoiceTask>(index, {
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

    editTask<ReadingMultipleChoiceTask>(index, {
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

    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: remappedOrder,
    });
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    const newOptions = [...newQuestions[questionIndex].options];

    newOptions.push({
      order: newOptions.length + 1,
      value: "",
      content: "",
    });

    newQuestions[questionIndex].options = newOptions;

    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: newQuestions,
    });
  };

  const editOptionContent = (
    questionIndex: number,
    optionIndex: number,
    content: string,
  ) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    const newOptions = [...newQuestions[questionIndex].options];

    if (!newOptions[optionIndex]) return;

    newOptions[optionIndex].content = content;
    newOptions[optionIndex].value = content;

    newQuestions[questionIndex].options = newOptions;

    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: newQuestions,
    });
  };

  const markOptionCorrect = (questionIndex: number, value: string) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    newQuestions[questionIndex].correctAnswer = value;

    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: newQuestions,
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    const options = [...newQuestions[questionIndex].options];

    if (!options[optionIndex]) return;

    const isCorrectAnswer =
      options[optionIndex].value == newQuestions[questionIndex].correctAnswer;

    options.splice(optionIndex, 1);

    const remappedOrder: typeof options = options.map((e, i) => {
      return {
        ...e,
        order: i + 1,
      };
    });

    newQuestions[questionIndex].options = remappedOrder;

    if (isCorrectAnswer) {
      newQuestions[questionIndex].correctAnswer = "";
    }

    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: newQuestions,
    });
  };

  const onDragEndOption = (
    questionIndex: number,
    sourceIndex: number,
    destinationIndex: number,
  ) => {
    const newQuestions = [...task.questions];

    if (!newQuestions[questionIndex]) return;

    const options = [...newQuestions[questionIndex].options];

    const temp = options[destinationIndex];

    if (!options[sourceIndex]) return;
    if (!temp) return;

    options[destinationIndex] = options[sourceIndex];

    options[sourceIndex] = temp;

    const remappedOrder: typeof options = options.map((e, i) => {
      return {
        ...e,
        order: i + 1,
      };
    });

    newQuestions[questionIndex].options = remappedOrder;

    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: newQuestions,
    });
  };

  const addQuestion = () => {
    const order = task.questions.length + 1;
    editTask<ReadingMultipleChoiceTask>(index, {
      ...task,
      questions: [
        ...task.questions,
        {
          order,
          options: [],
          content: `Question ${order}`,
          correctAnswer: "Option A",
        },
      ],
    });
  };

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl bg-background">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical />
          </div>
          <h3 className="font-bold">Multiple Choice Task</h3>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => duplicateTask(index)}
          >
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeTask(index)}>
            <X size={16} />
          </Button>
        </div>
      </div>
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
                      draggableId={`q-${qIndex}`}
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
                          <DragDropContext
                            onDragEnd={(result) => {
                              const source = result.source.index;
                              const destination = result.destination?.index;

                              if (destination != undefined) {
                                onDragEndOption(qIndex, source, destination);
                              }
                            }}
                          >
                            <Droppable
                              droppableId={`options-${qIndex}`}
                              type={`options-${qIndex}`}
                            >
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                >
                                  <RadioGroup
                                    value={q.correctAnswer}
                                    onValueChange={(value) => {
                                      markOptionCorrect(qIndex, value);
                                    }}
                                  >
                                    {q.options.map((opt, oIndex) => (
                                      <Draggable
                                        key={oIndex}
                                        draggableId={`opt-${qIndex}-${oIndex}`}
                                        index={oIndex}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="flex items-center gap-2 mb-2"
                                          >
                                            <div
                                              {...provided.dragHandleProps}
                                              className="cursor-grab"
                                            >
                                              <GripVertical />
                                            </div>
                                            <RadioGroupItem
                                              value={opt.value}
                                              id={`${qIndex}-${oIndex}`}
                                            />
                                            <Input
                                              placeholder="Option"
                                              value={opt.value}
                                              onChange={(event) => {
                                                editOptionContent(
                                                  qIndex,
                                                  oIndex,
                                                  event.target.value,
                                                );
                                              }}
                                            />
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                removeOption(qIndex, oIndex)
                                              }
                                            >
                                              <X size={16} />
                                            </Button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </RadioGroup>
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(qIndex)}
                          >
                            Add Option
                          </Button>
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
