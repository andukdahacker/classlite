"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { ReadingExerciseTypes } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  CheckIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Loader2Icon,
  Plus,
} from "lucide-react";
import { useContext, useState } from "react";
import { ReadingMultipleChoiceTask } from "../../../../schema/types";
import useUpdateExercise from "../../hooks/use-update-exercise";
import { MultipleChoiceTaskBuilder } from "./multiple-choice-task-builder";
import { ReadingComposerContext } from "./reading-composer-context";

function ReadingComposer() {
  const {
    name,
    setName,
    description,
    setDescription,
    title,
    setTitle,
    content,
    setContent,
    tasks,
    addTask,
    exercise,
    reorderTasks,
  } = useContext(ReadingComposerContext);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
    immediatelyRender: false,
  });

  const [maximizeContent, setMaximizeContent] = useState(true);

  const { mutate, isPending } = useUpdateExercise();

  const onDragEnd = (result: any) => {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    reorderTasks(source.index, destination.index);
  };

  return (
    <div className="flex flex-col gap-4 justify-center items-center p-4 pb-20 md:pb-4">
      <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl">
        <Input value={name} onChange={(event) => setName(event.target.value)} />

        <Textarea
          placeholder="Describe this exercise..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>

      <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl">
        <div className="flex justify-between flex-row">
          <span className="font-bold">Reading material</span>
          <Button
            size={"sm"}
            variant={"ghost"}
            onClick={() => setMaximizeContent(!maximizeContent)}
          >
            {maximizeContent ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
        {maximizeContent && (
          <>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <AppEditor editor={editor} />
          </>
        )}
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="w-full max-w-2xl flex flex-col gap-4"
            >
              {tasks.map((t, i) => (
                <Draggable key={i} draggableId={`task-${i}`} index={i}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      {(() => {
                        switch (t.type) {
                          case "Multiple choice":
                            return (
                              <MultipleChoiceTaskBuilder
                                task={t as ReadingMultipleChoiceTask}
                                index={i}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            );
                          case "True/False/Not Given":
                          case "Yes/No/Not Given":
                          case "Sentence Completion":
                          case "Summary Completion":
                          default:
                            return (
                              <div className="rounded-md border p-4 flex justify-between items-center w-full max-w-2xl bg-background">
                                <span>{t.type}</span>
                                <div {...provided.dragHandleProps}>
                                  <GripVertical />
                                </div>
                              </div>
                            );
                        }
                      })()}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="fixed bottom-4 md:top-1/2 md:right-4 md:bottom-auto flex md:flex-col justify-center w-full md:w-auto">
        <div className="flex md:flex-col gap-2 rounded-full border bg-background p-2 shadow-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ReadingExerciseTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => addTask(type)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() =>
              mutate({
                id: exercise!.id,
                content: {
                  title,
                  content,
                  tasks,
                },
                name,
              })
            }
            disabled={isPending}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ReadingComposer };
