import {
  Assignment,
  Exercise,
  ListeningExercise,
  ReadingExercise,
  Submission,
} from "@workspace/types";
import { ReviewListeningExercise } from "./review-listening-exercise";
import { ReviewReadingExercise } from "./review-reading-exercise";
import ReviewWritingExercise from "./review-writing-exercise";

interface ReviewAssignmentProps {
  exercise: Exercise;
  assignment: Assignment;
  submission: Submission;
}

function ReviewAssignment({
  exercise,
  assignment,
  submission,
}: ReviewAssignmentProps) {
  switch (exercise.type) {
    case "READING":
      return (
        <ReviewReadingExercise
          exercise={exercise.content as ReadingExercise}
          submission={submission}
        />
      );
    case "LISTENING":
      return (
        <ReviewListeningExercise
          exercise={exercise.content as ListeningExercise}
          submission={submission}
        />
      );
    case "WRITING":
      return (
        <ReviewWritingExercise
          exercise={exercise.content as ListeningExercise}
          submission={submission}
        />
      );
    case "SPEAKING":
  }

  return null;
}

export { ReviewAssignment };
