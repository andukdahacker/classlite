"use client";

import { useContext } from "react";
import { AuthContext } from "../../auth/components/auth-context";
import { CenterClassTable } from "./class-table";
import { UserClassTable } from "./user-class-table";

function ClassPage() {
  const { center, user } = useContext(AuthContext);

  if (center) {
    return <CenterClassTable centerId={center.id} />;
  }

  if (!user) return null;

  return <UserClassTable userId={user.id} />;
}

export { ClassPage };
