"use client";

import { AppEditor } from "@/core/components/editor/app-editor";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { type Content, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { type WritingExercise } from "@workspace/types";
import { Textarea } from "@workspace/ui/components/textarea";

interface WritingTaskViewerProps {
  task: WritingExercise;
}

function WritingTaskViewer({ task }: WritingTaskViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: task.title as Content,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="md:w-1/2 p-4 border-r h-full overflow-y-auto">
        {task.type === "Task 1" && task.file && (
          <div className="mb-4">
            <img
              src={task.file.url}
              alt="Writing Task 1 Image"
              className="max-w-full h-auto object-contain"
            />
          </div>
        )}
        <AppEditor editor={editor} showMenu={false} />
      </div>
      <div className="md:w-1/2 p-4 h-full overflow-y-auto">
        <Textarea
          className="h-full"
          placeholder="Write your response here..."
        />
      </div>
    </div>
  );
}

export { WritingTaskViewer };
