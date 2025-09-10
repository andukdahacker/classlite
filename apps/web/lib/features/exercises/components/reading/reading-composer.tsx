"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useContext, useState } from "react";
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
    <div className="flex flex-col gap-4 justify-center items-center p-4">
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
            return <div>Multiple choice task builder</div>;
          default:
            return <div key={i}>{t.type}</div>;
        }
      })}
    </div>
  );
}

export { ReadingComposer };
