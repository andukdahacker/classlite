"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { ReadingTFNGTask, ReadingYNNGTask } from "@/lib/schema/types";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";

interface FixedChoiceTaskViewerProps {
  task: ReadingTFNGTask | ReadingYNNGTask;
}

export function FixedChoiceTaskViewer({ task }: FixedChoiceTaskViewerProps) {
  const instructionEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: task.instructions as any,
    editable: false,
    immediatelyRender: false,
  });

  const options =
    task.type === "True/False/Not Given"
      ? ["True", "False", "Not Given"]
      : ["Yes", "No", "Not Given"];

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4">
      <h3 className="font-bold">{task.type}</h3>
      {(task.instructions as any) && <AppEditor editor={instructionEditor} />}
      <div className="flex flex-col gap-4">
        {task.questions.map((q, qIndex) => (
          <div key={qIndex} className="flex flex-col gap-2">
            <p>
              <strong>Question {q.order}:</strong> {q.content}
            </p>
            <RadioGroup className="ml-4 flex gap-4">
              {options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`${qIndex}-${oIndex}`} />
                  <Label htmlFor={`${qIndex}-${oIndex}`}>{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>
    </div>
  );
}
