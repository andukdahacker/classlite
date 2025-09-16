"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ReadingSentenceCompletionTask } from "@workspace/types";
import { useState } from "react";

interface SentenceCompletionDragAndDropViewerProps {
  task: ReadingSentenceCompletionTask;
}

export function SentenceCompletionDragAndDropViewer({
  task,
}: SentenceCompletionDragAndDropViewerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [options, setOptions] = useState(task.options ?? []);

  const contentEditor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Gap.extend({
        onUpdate(event) {
          console.log("event", event);
        },
        addNodeView() {
          return ReactNodeViewRenderer(({ node }) => {
            const gapIndex = node.attrs.order;
            console.log("Rendering gap", gapIndex, answers[gapIndex]);
            return (
              <NodeViewWrapper className="inline-block">
                <Droppable
                  droppableId={`gap-${gapIndex}`}
                  direction="horizontal"
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 border rounded-md min-h-16 min-w-24 flex items-center justify-center ${
                        snapshot.isDraggingOver ? "bg-gray-200" : ""
                      }`}
                    >
                      {answers[gapIndex] ? (
                        <Draggable draggableId={answers[gapIndex]!} index={0}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-2 rounded-md shadow-md"
                            >
                              {answers[gapIndex]}
                            </div>
                          )}
                        </Draggable>
                      ) : (
                        <span className="text-gray-400">{gapIndex}</span>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </NodeViewWrapper>
            );
          });
        },
      }),
    ],
    content: task.content,
    editable: false,
    immediatelyRender: false,
  });

  // useEffect(() => {
  //   if (contentEditor) {
  //     contentEditor.commands.setContent(task.content);
  //   }
  // }, [answers, contentEditor, task.content]);

  const onDragEnd = (result: DropResult<string>) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceId = source.droppableId;
    const destinationId = destination.droppableId;

    if (sourceId === destinationId && source.index === destination.index) {
      return;
    }

    if (sourceId === "options") {
      const newOptions = Array.from(options);
      const [removed] = newOptions.splice(source.index, 1);

      if (!removed) return;

      if (destinationId.startsWith("gap-")) {
        const gapIndex = destinationId.split("-")[1];
        if (!gapIndex) return;
        const newAnswers = { ...answers };
        const oldAnswer = newAnswers[gapIndex];
        if (oldAnswer) {
          newOptions.push(oldAnswer);
        }
        newAnswers[gapIndex] = removed;
        setAnswers(newAnswers);
      } else {
        newOptions.splice(destination.index, 0, removed);
      }
      setOptions(newOptions);
    } else if (sourceId.startsWith("gap-")) {
      const gapIndex = sourceId.split("-")[1];
      if (!gapIndex) return;
      const newAnswers = { ...answers };
      const movedItem = newAnswers[gapIndex];

      if (!movedItem) return;

      delete newAnswers[gapIndex];

      if (destinationId === "options") {
        const newOptions = Array.from(options);
        newOptions.splice(destination.index, 0, movedItem);
        setOptions(newOptions);
      } else if (destinationId.startsWith("gap-")) {
        const destGapIndex = destinationId.split("-")[1];
        if (!destGapIndex) return;
        const oldAnswer = newAnswers[destGapIndex];
        if (oldAnswer) {
          const newOptions = Array.from(options);
          newOptions.push(oldAnswer);
          setOptions(newOptions);
        }
        newAnswers[destGapIndex] = movedItem;
      }
      setAnswers(newAnswers);
    }
  };
  return (
    <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
      <div className="rounded-md border p-4 flex flex-col gap-4">
        <h3 className="font-bold">Sentence Completion</h3>
        <Droppable droppableId="options" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex gap-2 p-4 border rounded-md min-h-24 ${
                snapshot.isDraggingOver ? "bg-gray-100" : ""
              }`}
            >
              <AppEditor editor={contentEditor} showMenu={false} />
              {options.map((option, index) => (
                <Draggable key={option} draggableId={option} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white p-2 rounded-md shadow-md text-black"
                    >
                      {option}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}
