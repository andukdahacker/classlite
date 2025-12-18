"use client";

import {
  GalleryVerticalEnd,
  LayoutDashboardIcon,
  LibraryBig,
  School,
  Users2,
} from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { AuthContext } from "@/lib/features/auth/components/auth-context";
import { UserRole } from "@workspace/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";

// This is sample data.

export type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  allowRole: UserRole[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
    allowRole: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: <Users2 />,
    allowRole: ["ADMIN"],
  },
  {
    title: "Classes",
    url: "/dashboard/class",
    icon: <School />,
    allowRole: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    title: "Exercises",
    url: "/dashboard/exercises",
    icon: <LibraryBig />,
    allowRole: ["ADMIN", "TEACHER"],
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { center, user } = React.useContext(AuthContext);
  const isCenter = center !== undefined;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col text-left text-sm leading-tight">
                <span className="truncate font-medium">IELTS Nook</span>
                <span className="truncate text-xs">
                  {isCenter ? "ADMIN" : user?.role}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            isCenter
              ? {
                  email: center?.email ?? "",
                  name: center?.name ?? "",
                }
              : {
                  email: user?.email ?? "",
                  name: `${user?.firstName} ${user?.lastName}`,
                }
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
