import {
  LayoutDashboard,
  Users2,
  School,
  LibraryBig,
  Settings,
} from "lucide-react";
import type { UserRole } from "@workspace/types";

export interface NavItemConfig {
  title: string;
  url: string;
  icon: any;
  allowedRoles: UserRole[];
}

export const getNavigationConfig = (centerId: string): NavItemConfig[] => {
  const dashboardPath = `/${centerId}/dashboard`;

  return [
    {
      title: "Dashboard",
      url: dashboardPath,
      icon: LayoutDashboard,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
    },
    {
      title: "Users",
      url: `${dashboardPath}/users`,
      icon: Users2,
      allowedRoles: ["OWNER", "ADMIN"],
    },
    {
      title: "Classes",
      url: `${dashboardPath}/class`,
      icon: School,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
    },
    {
      title: "Exercises",
      url: `${dashboardPath}/exercises`,
      icon: LibraryBig,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
    },
    {
      title: "Settings",
      url: `${dashboardPath}/settings`,
      icon: Settings,
      allowedRoles: ["OWNER", "ADMIN"],
    },
  ];
};
