"use client";

import { Loader2Icon } from "lucide-react";
import useGetAssignment from "../assignments/hooks/use-get-assignment";
import { DoListeningExercise } from "./components/do-listening-exercise";
import { DoReadingExercise } from "./components/do-reading-exercise";
import { DoWritingExercise } from "./components/do-writing-exercise";

interface DoExercisePageProps {
  assignmentId: string;
}

function DoExercisePage({ assignmentId }: DoExercisePageProps) {
  const { data, status, error } = useGetAssignment(assignmentId);

  if (status == "pending") {
    return <Loader2Icon className="animate-spin" />;
  }

  if (status == "error") {
    return <div>{error.message}</div>;
  }

  switch (data.exercise.type) {
    case "READING":
      return (
        <DoReadingExercise
          exercise={data.exercise}
          assignment={data.assignment}
          submission={data.submission}
        />
      );
    case "LISTENING":
      return (
        <DoListeningExercise
          exercise={data.exercise}
          assignment={data.assignment}
          submission={data.submission}
        />
      );
    case "WRITING":
      return (
        <DoWritingExercise
          exercise={data.exercise}
          assignment={data.assignment}
          submission={data.submission}
        />
      );
    case "SPEAKING":
    default:
      return <div>Unsupported exercise type.</div>;
  }
}

export { DoExercisePage };
