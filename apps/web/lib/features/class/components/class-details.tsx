"use client";

import { useContext } from "react";
import { AuthContext } from "../../auth/components/auth-context";
import { ClassDetailsAdmin } from "./class-admin-details";

interface ClassDetailsProps {
  classId: string;
}

function ClassDetails({ classId }: ClassDetailsProps) {
  const { user, center } = useContext(AuthContext);

  if (center) {
    return <ClassDetailsAdmin classId={classId} />;
  }

  const role = user?.role;

  switch (role) {
    case "ADMIN":
      return <ClassDetailsAdmin classId={classId} />;
    case "TEACHER":
    case "STUDENT":
    default:
      return <div>Unauthorized</div>;
  }
}

export { ClassDetails };
