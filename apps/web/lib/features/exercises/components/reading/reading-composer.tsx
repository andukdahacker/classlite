"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { ChevronDown, ChevronUp, FileUp, Plus } from "lucide-react";
import { useContext, useState } from "react";
import { ReadingMultipleChoiceTask } from "../../../../schema/types";
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
    editTask,
    removeTask,
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

      {tasks.map((t, i) => {
        switch (t.type) {
          case "Multiple choice":
            return (
              <MultipleChoiceTaskBuilder
                key={i}
                task={t as ReadingMultipleChoiceTask}
                index={i}
              />
            );
          case "True/False/Not Given":
          case "Yes/No/Not Given":
          case "Sentence Completion":
          default:
            return <div key={i}>{t.type}</div>;
        }
      })}

      <div className="fixed bottom-4 md:top-1/2 md:right-4 md:bottom-auto flex md:flex-col justify-center w-full md:w-auto">
        <div className="flex md:flex-col gap-2 rounded-full border bg-background p-2 shadow-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Multiple choice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="icon" variant="outline">
            <FileUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ReadingComposer };
