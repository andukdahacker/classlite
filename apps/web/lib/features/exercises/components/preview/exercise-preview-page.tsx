"use client";

import { ReadingMaterialViewer } from "@/lib/features/exercises/components/reading/reading-material-viewer";
import { TaskViewer } from "@/lib/features/exercises/components/reading/task-viewer";
import { useGetExercise } from "@/lib/features/exercises/hooks/use-get-exercise";
import { ReadingExercise } from "@/lib/schema/types";
import { Content } from "@tiptap/core";
import { notFound } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ExercisePreviewPageProps {
  id: string;
}

function ExercisePreviewPage({ id }: ExercisePreviewPageProps) {
  const { data: exercise, isLoading } = useGetExercise(id);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!exercise) {
    return notFound();
  }

  const readingExercise = exercise.exercise.content as ReadingExercise;

  return (
    <div className="h-screen">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50}>
          <ReadingMaterialViewer
            title={readingExercise.title}
            content={readingExercise.content as Content}
          />
        </Panel>
        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
        <Panel defaultSize={50}>
          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
            {readingExercise.tasks.map((task, index) => (
              <TaskViewer key={index} task={task} />
            ))}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export { ExercisePreviewPage };
