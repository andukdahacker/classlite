import {
  LayoutDashboard,
  Users2,
  BookOpen,
  School,
  Calendar,
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
      title: "Courses",
      url: `${dashboardPath}/courses`,
      icon: BookOpen,
      allowedRoles: ["OWNER", "ADMIN"],
    },
    {
      title: "Classes",
      url: `${dashboardPath}/classes`,
      icon: School,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
    },
    {
      title: "Schedule",
      url: `${dashboardPath}/schedule`,
      icon: Calendar,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
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
