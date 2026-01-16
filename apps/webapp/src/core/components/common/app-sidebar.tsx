"use client";

import {
    GalleryVerticalEnd,
    LayoutDashboardIcon,
    LibraryBig,
    School,
    Users2,
} from "lucide-react";
import * as React from "react";

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
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

// This is sample data.

export type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: <Users2 />,
  },
  {
    title: "Classes",
    url: "/dashboard/class",
    icon: <School />,
  },
  {
    title: "Exercises",
    url: "/dashboard/exercises",
    icon: <LibraryBig />,
  },
] as const;

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

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
                <span className="truncate font-medium">ClassLite</span>
                <span className="truncate text-xs">
                    Role
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            {
                email: "ducdo@gmail.com",
                name: "Duc Do",
            }
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
