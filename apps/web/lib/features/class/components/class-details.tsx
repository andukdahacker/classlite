"use client";

import { useContext } from "react";
import { AuthContext } from "../../auth/components/auth-context";
import { ClassDetailsAdmin } from "./class-admin-details";
import { ClassDetailsTeacher } from "./class-teacher-details";
import { ClassDetailsStudent } from "./class-student-details";

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
      return <ClassDetailsTeacher classId={classId} />;
    case "STUDENT":
      return <ClassDetailsStudent classId={classId} />;
    default:
      return <div>Unauthorized</div>;
  }
}

export { ClassDetails };
