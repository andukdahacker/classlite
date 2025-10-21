"use client";

import { Loader2Icon } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../auth/components/auth-context";
import useGetAssignment from "./hooks/use-get-assignment";
import { ReviewAssignment } from "./review-assignment";
import { ViewAssignedAssignment } from "./view-assigned-assignments";

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
        return (
          <ReviewAssignment
            assignment={data.assignment}
            exercise={data.exercise}
            submission={data.submission!}
          />
        );
    }
  }

  switch (user?.role) {
    case "ADMIN": {
      switch (data.assignment.status) {
        case "ASSIGNED":
        case "SUBMITTED":
        case "REVIEWED":
      }
    }
    case "TEACHER": {
      switch (data.assignment.status) {
        case "ASSIGNED":
        case "SUBMITTED":
        case "REVIEWED":
      }
    }
    case "STUDENT": {
      switch (data.assignment.status) {
        case "ASSIGNED":
        case "SUBMITTED":
        case "REVIEWED":
      }
    }
  }
}

export { AssignmentDetails };
