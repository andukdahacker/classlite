"use client";

import { useContext } from "react";
import { AuthContext } from "../../auth/components/auth-context";
import { CenterClassTable } from "./class-table";

function ClassPage() {
  const { center, user } = useContext(AuthContext);

  if (center) {
    return <CenterClassTable centerId={center.id} />;
  }

  switch (user?.role) {
    case "ADMIN":
      return (
        <div>
          <h1>Welcome Admin</h1>
          <p>You have full access to manage the classes.</p>
        </div>
      );
    case "TEACHER":
      return (
        <div>
          <h1>Welcome Teacher</h1>
          <p>You can view and manage your classes.</p>
        </div>
      );
    case "STUDENT":
      return (
        <div>
          <h1>Welcome Student</h1>
          <p>You can view your enrolled classes.</p>
        </div>
      );
    default:
      return (
        <div>
          <h1>Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      );
  }
}

export { ClassPage };
