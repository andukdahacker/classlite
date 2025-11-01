import { Assignment, Exercise, Submission } from "@workspace/types";
import { ListeningExerciseSubmissionDetails } from "./listening-exercise-submission-details";
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
        <ReviewReadingExercise exercise={exercise} submission={submission} />
      );
    case "LISTENING":
      return (
        <ListeningExerciseSubmissionDetails
          exercise={exercise}
          submission={submission}
          isReviewing
        />
      );
    case "WRITING":
      return (
        <ReviewWritingExercise exercise={exercise} submission={submission} />
      );
    case "SPEAKING":
  }

  return null;
}

export { ReviewAssignment };
