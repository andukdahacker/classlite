"use client";

import { Loader2Icon } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../auth/components/auth-context";
import useGetAssignment from "./hooks/use-get-assignment";
import { ListeningExerciseSubmissionDetails } from "./listening-exercise-submission-details";
import { ReadingExerciseSubmissionDetails } from "./reading-exercise-submission-details";
import { ViewAssignedAssignment } from "./view-assigned-assignments";
import { WritingExerciseSubmissionDetails } from "./writing-exercise-submission-details";

interface AssignmentDetailsProps {
  id: string;
}

function AssignmentDetails({ id }: AssignmentDetailsProps) {
  const { center, user } = useContext(AuthContext);
  const { data, status, error } = useGetAssignment(id);

  if (status == "pending") {
    return <Loader2Icon className="animate-spin" />;
  }

  if (status == "error") {
    return <div>{error.message}</div>;
  }

  if (center) {
    switch (data.assignment.status) {
      case "ASSIGNED":
        return (
          <ViewAssignedAssignment
            assignment={data.assignment}
            exercise={data.exercise}
            student={data.student}
          />
        );
      case "SUBMITTED":
      case "REVIEWED":
        switch (data.exercise.type) {
          case "READING":
            return (
              <ReadingExerciseSubmissionDetails
                exercise={data.exercise}
                submission={data.submission!}
                isReviewing
              />
            );
          case "LISTENING":
            return (
              <ListeningExerciseSubmissionDetails
                exercise={data.exercise}
                submission={data.submission!}
                isReviewing
              />
            );
          case "WRITING":
            return (
              <WritingExerciseSubmissionDetails
                exercise={data.exercise}
                submission={data.submission!}
                isReviewing
              />
            );
        }
    }
  }

  switch (user?.role) {
    case "ADMIN": {
      switch (data.assignment.status) {
        case "ASSIGNED":
          return (
            <ViewAssignedAssignment
              assignment={data.assignment}
              exercise={data.exercise}
              student={data.student}
            />
          );
        case "SUBMITTED":
        case "REVIEWED":
          switch (data.exercise.type) {
            case "READING":
              return (
                <ReadingExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                  isReviewing
                />
              );
            case "LISTENING":
              return (
                <ListeningExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                  isReviewing
                />
              );
            case "WRITING":
              return (
                <WritingExerciseSubmissionDetails
                  exercise={data.exercise as any}
                  submission={data.submission!}
                  isReviewing
                />
              );
          }
      }
    }
    case "TEACHER": {
      switch (data.assignment.status) {
        case "ASSIGNED":
          return (
            <ViewAssignedAssignment
              assignment={data.assignment}
              exercise={data.exercise}
              student={data.student}
            />
          );
        case "SUBMITTED":
        case "REVIEWED":
          switch (data.exercise.type) {
            case "READING":
              return (
                <ReadingExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                  isReviewing
                />
              );
            case "LISTENING":
              return (
                <ListeningExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                  isReviewing
                />
              );
            case "WRITING":
              return (
                <WritingExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                  isReviewing
                />
              );
          }
      }
    }
    case "STUDENT": {
      switch (data.assignment.status) {
        case "ASSIGNED":
        case "SUBMITTED":
        case "REVIEWED":
          switch (data.exercise.type) {
            case "READING":
              return (
                <ReadingExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                />
              );
            case "LISTENING":
              return (
                <ListeningExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                />
              );
            case "WRITING":
              return (
                <WritingExerciseSubmissionDetails
                  exercise={data.exercise}
                  submission={data.submission!}
                />
              );
          }
      }
    }
  }
}

export { AssignmentDetails };
