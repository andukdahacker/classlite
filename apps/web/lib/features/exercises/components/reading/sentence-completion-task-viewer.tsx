import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import { GapInput } from "@/lib/core/components/editor/extensions/gap-input";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ReadingSentenceCompletionTask } from "@workspace/types";
import { SentenceCompletionDragAndDropViewer } from "./sentence-completion-dnd-viewer";

interface SentenceCompletionTaskViewerProps {
  task: ReadingSentenceCompletionTask;
}

export function SentenceCompletionTaskViewer({
  task,
}: SentenceCompletionTaskViewerProps) {
  const instructionEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: task.instruction,
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
    ],
    content: task.content,
    editable: false,
    immediatelyRender: false,
  });

  if (task.taskType === "DragAndDrop") {
    return <SentenceCompletionDragAndDropViewer task={task} />;
  }

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4">
      <h3 className="font-bold">Sentence Completion</h3>
      {task.instruction && <AppEditor editor={instructionEditor} />}
      <AppEditor editor={contentEditor} />
    </div>
  );
}
