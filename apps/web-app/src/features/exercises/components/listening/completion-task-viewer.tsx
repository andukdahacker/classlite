"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import { GapInput } from "@/lib/core/components/editor/extensions/gap-input";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ListeningCompletionTask } from "@workspace/types";
import { CompletionDragAndDropViewer } from "./completion-dnd-viewer";

interface CompletionTaskViewerProps {
  task: ListeningCompletionTask;
  questionBefore: number;
}

export function CompletionTaskViewer({ task, questionBefore }: CompletionTaskViewerProps) {
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
          return ReactNodeViewRenderer(GapInput);
        },
      }),
      TableKit,
    ],
    content: task.content,
    editable: false,
    immediatelyRender: false,
  });

  if (task.taskType === "DragAndDrop") {
    return <CompletionDragAndDropViewer task={task} questionBefore={questionBefore} />;
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground p-4 sm:p-6 flex flex-col gap-6">
      <h3 className="text-xl font-bold">Completion</h3>
      {task.instructions && <AppEditor editor={instructionEditor} />}
      <AppEditor editor={contentEditor} showMenu={false} />
    </div>
  );
}