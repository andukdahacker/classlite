"use client";

import {
  ListeningExercise,
  ReadingExercise,
  WritingExercise,
} from "@workspace/types";
import { Loader2Icon } from "lucide-react";
import { useGetExercise } from "../hooks/use-get-exercise";
import { ListeningComposer } from "./listening/listening-composer";
import { ListeningComposerProvider } from "./listening/listening-composer-provider";
import { ReadingComposer } from "./reading/reading-composer";
import { ReadingComposerProvider } from "./reading/reading-composer-provider";
import { WritingComposer } from "./writing/writing-composer";
import { WritingComposerProvider } from "./writing/writing-composer-provider";

interface ExerciseEditProps {
  id: string;
}

function ExerciseEdit({ id }: ExerciseEditProps) {
  const { data, status, error } = useGetExercise(id);

  switch (status) {
    case "pending": {
      return <Loader2Icon className="animate-spin" />;
    }
    case "error": {
      return <div>{error.message}</div>;
    }
    case "success": {
      const type = data.exercise.type;

      switch (type) {
        case "READING": {
          const readingExercise = data.exercise.content as ReadingExercise;

          return (
            <ReadingComposerProvider
              readingExercise={readingExercise}
              exercise={data.exercise}
            >
              <ReadingComposer />
            </ReadingComposerProvider>
          );
        }
        case "LISTENING": {
          const listeningExercise = data.exercise.content as ListeningExercise;

          return (
            <ListeningComposerProvider
              listeningExercise={listeningExercise}
              exercise={data.exercise}
            >
              <ListeningComposer />
            </ListeningComposerProvider>
          );
        }
        case "WRITING": {
          const writingExercise = data.exercise.content as WritingExercise;

          return (
            <WritingComposerProvider
              writingExercise={writingExercise}
              exercise={data.exercise}
            >
              <WritingComposer />
            </WritingComposerProvider>
          );
        }
      }
    }
  }
}

export { ExerciseEdit };
