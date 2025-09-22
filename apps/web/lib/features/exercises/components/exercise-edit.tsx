"use client";

import { ReadingExercise } from "@workspace/types";
import { Loader2Icon } from "lucide-react";
import { useGetExercise } from "../hooks/use-get-exercise";
import { ReadingComposer } from "./reading/reading-composer";
import { ReadingComposerProvider } from "./reading/reading-composer-provider";

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
      }
    }
  }
}

export { ExerciseEdit };
