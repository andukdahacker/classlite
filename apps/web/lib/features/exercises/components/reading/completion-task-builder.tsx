"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ReadingCompletionTask } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Trash2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ReadingComposerContext } from "./reading-composer-context";
import { TaskHeader } from "./task-header";

interface CompletionTaskBuilderProps {
  task: ReadingCompletionTask;
  index: number;
  dragHandleProps: any;
}

export function CompletionTaskBuilder({
  task,
  index,
  dragHandleProps,
}: CompletionTaskBuilderProps) {
  const { editTask, removeTask, duplicateTask } = useContext(
    ReadingComposerContext,
  );
  const [isExpanded, setIsExpanded] = useState(true);

  const handleInstructionChange = (e: any) => {
    editTask<ReadingCompletionTask>(index, { ...task, instructions: e });
  };

  const instructionEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: task.instructions ?? "",
    onUpdate: ({ editor }) => {
      handleInstructionChange(editor.getJSON());
    },
    immediatelyRender: false,
  });

  const contentEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Gap,
      TableKit.configure({
        table: {
          resizable: true,
        },
      }),
    ],
    content: task.content ?? "",
    onUpdate: ({ editor }) => {
      const newContent = editor.getJSON();
      const gaps = findGaps(newContent);

      const newQuestions = gaps.map((g, i) => ({
        order: i + 1,
        correctAnswer: task.questions[g.originalOrder - 1]?.correctAnswer ?? "",
      }));

      // Update gap orders in the content
      let gapIndex = 1;
      const updatedJson = JSON.parse(JSON.stringify(newContent));
      const walk = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (node.type === "gap") {
            node.attrs.order = gapIndex++;
          }
          if (node.content) {
            walk(node.content);
          }
        });
      };
      if (updatedJson.content) {
        walk(updatedJson.content);
      }

      editTask(index, {
        ...task,
        content: updatedJson,
        questions: newQuestions,
      });
    },
    immediatelyRender: false,
  });

  const findGaps = (content: JSONContent) => {
    const gaps: { order: number; originalOrder: number }[] = [];
    let order = 1;
    const walk = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.type === "gap") {
          gaps.push({ order: order++, originalOrder: node.attrs.order });
        }
        if (node.content) {
          walk(node.content);
        }
      });
    };
    if (content.content) {
      walk(content.content);
    }
    return gaps;
  };

  const addGap = () => {
    const newOrder = task.questions.length + 1;
    contentEditor?.commands.setGap({ order: newOrder });
  };

  const editCorrectAnswer = (qIndex: number, answer: string) => {
    const newQuestions = [...task.questions];
    if (newQuestions[qIndex]) {
      newQuestions[qIndex].correctAnswer = answer;
      editTask(index, { ...task, questions: newQuestions });
    }
  };

  const handleTaskTypeChange = (
    taskType: ReadingCompletionTask["taskType"],
  ) => {
    editTask<ReadingCompletionTask>(index, {
      ...task,
      taskType,
      options: taskType === "DragAndDrop" ? [] : undefined,
    });
  };

  const handleAddOption = () => {
    const newOptions = [...(task.options ?? []), "Option"];
    editTask<ReadingCompletionTask>(index, {
      ...task,
      options: newOptions,
    });
  };

  const handleEditOption = (oIndex: number, value: string) => {
    const newOptions = [...(task.options ?? [])];
    newOptions[oIndex] = value;
    editTask<ReadingCompletionTask>(index, {
      ...task,
      options: newOptions,
    });
  };

  const handleRemoveOption = (oIndex: number) => {
    const newOptions = [...(task.options ?? [])];
    newOptions.splice(oIndex, 1);
    editTask<ReadingCompletionTask>(index, {
      ...task,
      options: newOptions,
    });
  };

  useEffect(() => {
    if (contentEditor && !contentEditor.isDestroyed) {
      const currentContent = JSON.stringify(contentEditor.getJSON());
      const taskContent = JSON.stringify(task.content);
      if (currentContent !== taskContent) {
        contentEditor.commands.setContent(task.content ?? "");
      }
    }
  }, [task.content, contentEditor]);

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl bg-background">
      <TaskHeader
        title={task.type}
        isExpanded={isExpanded}
        onExpand={() => setIsExpanded(!isExpanded)}
        onDuplicate={() => duplicateTask(index)}
        onRemove={() => removeTask(index)}
        dragHandleProps={dragHandleProps}
      />
      {isExpanded && (
        <>
          <Label>Instructions</Label>
          <AppEditor editor={instructionEditor} />

          <div className="flex flex-col gap-2">
            <Label>Task Type</Label>
            <RadioGroup
              defaultValue={task.taskType ?? "Typing"}
              onValueChange={(value) =>
                handleTaskTypeChange(value as ReadingCompletionTask["taskType"])
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Typing" id="typing" />
                <Label htmlFor="typing">Typing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DragAndDrop" id="drag-and-drop" />
                <Label htmlFor="drag-and-drop">Drag and Drop</Label>
              </div>
            </RadioGroup>
          </div>

          <Label>Content</Label>
          <AppEditor editor={contentEditor} />
          <Button
            onClick={addGap}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            Add Gap
          </Button>

          {task.taskType === "DragAndDrop" && (
            <div className="flex flex-col gap-2 mt-4">
              <h4 className="font-semibold">Options</h4>
              {task.options?.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <Input
                    placeholder="Option"
                    value={option}
                    onChange={(e) => handleEditOption(oIndex, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(oIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={handleAddOption}
                variant="outline"
                size="sm"
                className="w-fit"
              >
                Add Option
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <h4 className="font-semibold">Answers</h4>
            {task.questions.map((q, qIndex) => (
              <div key={qIndex} className="flex items-center gap-2">
                <Label className="w-20">Gap {q.order}</Label>
                {task.taskType === "DragAndDrop" ? (
                  <Select
                    value={q.correctAnswer}
                    onValueChange={(value) => editCorrectAnswer(qIndex, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {task.options
                        ?.filter((option) => option !== "")
                        .map((option, oIndex) => (
                          <SelectItem key={oIndex} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Correct Answer"
                    value={q.correctAnswer}
                    onChange={(e) => editCorrectAnswer(qIndex, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
