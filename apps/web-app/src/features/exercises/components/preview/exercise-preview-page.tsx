"use client";

import { TaskViewer as ListeningTaskViewer } from "@/lib/features/exercises/components/listening/task-viewer";
import { ReadingMaterialViewer } from "@/lib/features/exercises/components/reading/reading-material-viewer";
import { TaskViewer as ReadingTaskViewer } from "@/lib/features/exercises/components/reading/task-viewer";
import { WritingTaskViewer } from "@/lib/features/exercises/components/writing/writing-task-viewer";
import { useGetExercise } from "@/lib/features/exercises/hooks/use-get-exercise";
import { Content } from "@tiptap/core";
import {
  ExerciseType,
  ListeningExercise,
  ReadingExercise,
  WritingExercise,
} from "@workspace/types";
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

  const exerciseType: ExerciseType = exercise.exercise.type;

  switch (exerciseType) {
    case "READING": {
      const readingExercise = exercise.exercise.content
        ? (exercise.exercise.content as ReadingExercise)
        : null;
      if (!readingExercise) {
        return (
          <div className="p-4">No reading exercise content available.</div>
        );
      }

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
                  <ReadingTaskViewer
                    key={index}
                    task={task}
                    tasks={readingExercise.tasks}
                    index={index}
                  />
                ))}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      );
    }
    case "LISTENING": {
      const listeningExercise = exercise.exercise.content
        ? (exercise.exercise.content as ListeningExercise)
        : null;
      if (!listeningExercise) {
        return (
          <div className="p-4">No listening exercise content available.</div>
        );
      }
      return (
        <div className="h-screen">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50}>
              <div className="p-4 h-full overflow-y-auto">
                <h1 className="text-2xl font-bold mb-4">
                  {exercise.exercise.name}
                </h1>
                {listeningExercise.file && (
                  <audio
                    src={listeningExercise.file.url}
                    controls
                    className="w-full"
                  />
                )}
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <Panel defaultSize={50}>
              <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
                {listeningExercise.tasks.map((task, index) => (
                  <ListeningTaskViewer
                    key={index}
                    task={task}
                    tasks={listeningExercise.tasks}
                    index={index}
                  />
                ))}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      );
    }
    case "WRITING": {
      const writingExercise = exercise.exercise.content
        ? (exercise.exercise.content as WritingExercise)
        : null;

      if (!writingExercise) {
        return (
          <div className="p-4">No writing exercise content available.</div>
        );
      }

      return <WritingTaskViewer task={writingExercise} />;
    }
    default:
      return <div className="p-4">Unsupported exercise type.</div>;
  }
}

export { ExercisePreviewPage };
