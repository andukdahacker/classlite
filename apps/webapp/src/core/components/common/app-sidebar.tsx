"use client";

import { GalleryVerticalEnd } from "lucide-react";
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
import { useTenant } from "@/features/tenants/tenant-context";
import { useAuth } from "@/features/auth/auth-context";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { getNavigationConfig } from "@/core/config/navigation";

export type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  badge?: string;
};

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const centerId = user?.centerId;

  const navConfig = getNavigationConfig(centerId || "default");
  const filteredNavItems = navConfig
    .filter((item) => user?.role && item.allowedRoles.includes(user.role))
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      title: item.title,
      url: item.url,
      icon: <item.icon />,
      // Teachers have read-only access to Classes
      badge: user?.role === "TEACHER" && item.title === "Classes" ? "Read" : undefined,
    }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="size-6 rounded"
                  />
                ) : (
                  <GalleryVerticalEnd className="size-4" />
                )}
              </div>
              <div className="flex flex-col text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {tenant?.name || "ClassLite"}
                </span>
                <span className="truncate text-xs">{user?.role}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            email: user?.email || "",
            name: user?.name || "",
            avatar: user?.avatarUrl || "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
