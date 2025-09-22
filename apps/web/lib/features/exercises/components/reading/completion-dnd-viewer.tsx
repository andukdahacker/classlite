"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ReadingCompletionTask } from "@workspace/types";
import { DragEvent, useState } from "react";

interface CompletionDragAndDropViewerProps {
  task: ReadingCompletionTask;
}

export function CompletionDragAndDropViewer({
  task,
}: CompletionDragAndDropViewerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [options, setOptions] = useState(task.options ?? []);

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    item: string,
    source: string,
  ) => {
    e.dataTransfer.setData("text/plain", item);
    e.dataTransfer.setData("source", source);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    target: string,
    isGap: boolean,
  ) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    const source = e.dataTransfer.getData("source");

    if (source === "options" && !isGap) {
      return;
    }

    if (source === "options") {
      const newOptions = options.filter((o) => o !== item);
      if (isGap) {
        const gapIndex = target;
        const existingItem = answers[gapIndex];
        if (existingItem) {
          newOptions.push(existingItem);
        }
        setAnswers({ ...answers, [gapIndex]: item });
      }
      setOptions(newOptions);
    } else if (source.startsWith("gap-")) {
      const sourceGapIndex = source.replace("gap-", "");
      const newAnswers = { ...answers };
      delete newAnswers[sourceGapIndex];

      if (isGap) {
        const targetGapIndex = target;
        const existingItem = newAnswers[targetGapIndex];
        if (existingItem) {
          const newOptions = [...options, existingItem];
          setOptions(newOptions);
        }
        newAnswers[targetGapIndex] = item;
      } else {
        const newOptions = [...options, item];
        setOptions(newOptions);
      }
      setAnswers(newAnswers);
    }
  };

  const contentEditor = useEditor(
    {
      extensions: [
        StarterKit,
        Link,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TableKit,
        Gap.extend({
          addNodeView() {
            return ReactNodeViewRenderer(({ node }) => {
              const gapIndex = String(node.attrs.order);
              return (
                <NodeViewWrapper className="inline-block px-1">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, gapIndex, true)}
                    className="border-2 border-dashed rounded-md min-h-[3.5rem] p-2 min-w-[8rem] flex items-center justify-center bg-muted/20"
                  >
                    {answers[gapIndex] ? (
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(
                            e,
                            answers[gapIndex]!,
                            `gap-${gapIndex}`,
                          )
                        }
                        className="bg-background border rounded-lg p-2 shadow-sm text-sm cursor-move w-full text-center"
                      >
                        <span className="text-xs text-muted-foreground font-semibold">
                          {gapIndex}
                        </span>
                        <div className="font-medium">{answers[gapIndex]}</div>
                      </div>
                    ) : (
                      <span className="font-semibold text-muted-foreground">
                        {gapIndex}
                      </span>
                    )}
                  </div>
                </NodeViewWrapper>
              );
            });
          },
        }),
      ],
      content: task.content,
      editable: false,
      immediatelyRender: false,
    },
    [answers],
  );

  return (
    <div className="rounded-lg border bg-card text-card-foreground p-4 sm:p-6 flex flex-col gap-6">
      <h3 className="text-xl font-bold">Completion</h3>
      <AppEditor editor={contentEditor} showMenu={false} />
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "options", false)}
        className="flex flex-col gap-4 p-4 border rounded-lg min-h-[8rem] bg-muted/30"
      >
        <h4 className="font-semibold">Word Bank</h4>
        <div className="flex gap-2 flex-wrap">
          {options.map((option) => (
            <div
              key={option}
              draggable
              onDragStart={(e) => handleDragStart(e, option, "options")}
              className="bg-background border rounded-lg px-3 py-1.5 shadow-sm text-sm cursor-move hover:shadow-md transition-shadow"
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
