"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Content, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ReadingMultipleChoiceTask } from "@workspace/types";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";

interface MultipleChoiceTaskViewerProps {
  task: ReadingMultipleChoiceTask;
  questionBefore: number;
}

export function MultipleChoiceTaskViewer({
  task,
  questionBefore,
}: MultipleChoiceTaskViewerProps) {
  const instructionEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: task.instructions as Content,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="rounded-md border p-4 flex flex-col gap-4">
      <h3 className="font-bold">Multiple Choice Task</h3>
      {(task.instructions as Content) && (
        <AppEditor editor={instructionEditor} showMenu={false} />
      )}
      <div className="flex flex-col gap-4">
        {task.questions.map((q, qIndex) => (
          <div key={qIndex} className="flex flex-col gap-2">
            <p>
              <strong>{q.order + questionBefore}.</strong> {q.content}
            </p>
            <RadioGroup className="ml-4">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={opt.value}
                    id={`${qIndex}-${oIndex}`}
                  />
                  <Label htmlFor={`${qIndex}-${oIndex}`}>{opt.content}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>
    </div>
  );
}
