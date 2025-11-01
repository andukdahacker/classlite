"use client";

import { Exercise, Submission } from "@workspace/types";
import { ReadingExerciseSubmissionDetails } from "./reading-exercise-submission-details";

interface ReviewReadingExerciseProps {
  exercise: Exercise;
  submission: Submission;
}

function ReviewReadingExercise({
  exercise,
  submission,
}: ReviewReadingExerciseProps) {
  return (
    <ReadingExerciseSubmissionDetails
      exercise={exercise}
      submission={submission}
      isReviewing
    />
  );
}

export { ReviewReadingExercise };
