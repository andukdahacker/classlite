"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { TaskViewer as ListeningTaskViewer } from "@/lib/features/exercises/components/listening/task-viewer";
import { ReadingMaterialViewer } from "@/lib/features/exercises/components/reading/reading-material-viewer";
import { TaskViewer as ReadingTaskViewer } from "@/lib/features/exercises/components/reading/task-viewer";
import { WritingTaskViewer } from "@/lib/features/exercises/components/writing/writing-task-viewer";
import { Content } from "@tiptap/core";
import {
  Exercise,
  ExerciseType,
  ListeningExercise,
  ReadingExercise,
  WritingExercise,
} from "@workspace/types";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ExercisePreviewProps {
  exercise: Exercise;
}

function ExercisePreview({ exercise }: ExercisePreviewProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const direction = isDesktop ? "horizontal" : "vertical";
  const exerciseType: ExerciseType = exercise.type;

  switch (exerciseType) {
    case "READING": {
      const readingExercise = exercise.content as ReadingExercise;
      return (
        <div className="h-screen">
          <PanelGroup direction={direction}>
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
      const listeningExercise = exercise.content as ListeningExercise;
      return (
        <div className="h-screen">
          <PanelGroup direction={direction}>
            <Panel defaultSize={50}>
              <div className="p-4 h-full overflow-y-auto">
                <h1 className="text-2xl font-bold mb-4">{exercise.name}</h1>
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
      const writingExercise = exercise.content as WritingExercise;
      return <WritingTaskViewer task={writingExercise} />;
    }
    default:
      return <div className="p-4">Unsupported exercise type.</div>;
  }
}

export { ExercisePreview };
