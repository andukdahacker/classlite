import {
  LayoutDashboard,
  Calendar,
  School,
  Library,
  ClipboardList,
  GraduationCap,
  Users,
  Settings,
  UserCircle,
} from "lucide-react";
import type { UserRole } from "@workspace/types";

export interface NavItemConfig {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  order: number;
  mobileVisible: boolean;
  badge?: string;
}

export const getNavigationConfig = (centerId: string): NavItemConfig[] => {
  const dashboardPath = `/${centerId}/dashboard`;

  return [
    {
      title: "Dashboard",
      url: dashboardPath,
      icon: LayoutDashboard,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
      order: 1,
      mobileVisible: true,
    },
    {
      title: "Schedule",
      url: `${dashboardPath}/schedule`,
      icon: Calendar,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
      order: 2,
      mobileVisible: true,
    },
    {
      title: "Classes",
      url: `${dashboardPath}/classes`,
      icon: School,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
      order: 3,
      mobileVisible: true,
    },
    {
      title: "Exercises",
      url: `${dashboardPath}/exercises`,
      icon: Library,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
      order: 4,
      mobileVisible: true,
    },
    {
      title: "Mock Tests",
      url: `${dashboardPath}/mock-tests`,
      icon: ClipboardList,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
      order: 5,
      mobileVisible: false,
    },
    {
      title: "Grading",
      url: `${dashboardPath}/grading`,
      icon: GraduationCap,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
      order: 6,
      mobileVisible: false,
    },
    {
      title: "Students",
      url: `${dashboardPath}/students`,
      icon: Users,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
      order: 7,
      mobileVisible: false,
    },
    {
      title: "Settings",
      url: `${dashboardPath}/settings`,
      icon: Settings,
      allowedRoles: ["OWNER", "ADMIN"],
      order: 8,
      mobileVisible: false,
    },
    {
      title: "My Profile",
      url: `${dashboardPath}/profile`,
      icon: UserCircle,
      allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
      order: 9,
      mobileVisible: false,
    },
  ];
};

/**
 * Get nav items visible in mobile bottom bar (mobileVisible: true, max 4)
 */
export const getMobileNavItems = (items: NavItemConfig[]): NavItemConfig[] => {
  return items
    .filter((i) => i.mobileVisible)
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);
};

/**
 * Get nav items for overflow menu (items not in mobile bottom bar)
 */
export const getOverflowNavItems = (items: NavItemConfig[]): NavItemConfig[] => {
  const mobileItems = getMobileNavItems(items);
  return items
    .filter((i) => !mobileItems.includes(i))
    .sort((a, b) => a.order - b.order);
};
