"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  ListeningExerciseTypes,
} from "@workspace/types";
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
  Eye,
  GripVertical,
  Loader2Icon,
  Plus,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useContext } from "react";
import useUpdateExercise from "../../hooks/use-update-exercise";
import { ListeningComposerContext } from "./listening-composer-context";

function ListeningComposer() {
  const {
    name,
    setName,
    description,
    setDescription,
    listeningFile,
    setListeningFile,
    tasks,
    addTask,
    exercise,
    reorderTasks,
  } = useContext(ListeningComposerContext);

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
          <span className="font-bold">Listening File</span>
        </div>
        {listeningFile ? (
          <div className="flex items-center gap-2">
            <audio src={listeningFile} controls className="w-full" />
            <Button size="icon" variant="destructive" onClick={() => setListeningFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">MP3, WAV, or OGG (MAX. 25MB)</p>
                </div>
                <input id="file-upload" type="file" className="hidden" />
            </label>
        </div> 
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
                      <div className="rounded-md border p-4 flex justify-between items-center w-full max-w-2xl bg-background">
                        <span>{t.type}</span>
                        <div {...provided.dragHandleProps}>
                          <GripVertical />
                        </div>
                      </div>
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
              {ListeningExerciseTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => addTask(type)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href={`/dashboard/exercises/${exercise?.id}/preview`}>
            <Button size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            onClick={() =>
              mutate({
                id: exercise!.id,
                content: {
                  listeningFile,
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

export { ListeningComposer };
