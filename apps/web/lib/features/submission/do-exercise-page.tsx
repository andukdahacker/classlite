"use client";

import { Loader2Icon } from "lucide-react";
import useGetAssignment from "../assignments/hooks/use-get-assignment";
import { DoReadingExercise } from "./components/do-reading-exercise";

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
    case "WRITING":
    case "SPEAKING":
  }
}

export { DoExercisePage };
