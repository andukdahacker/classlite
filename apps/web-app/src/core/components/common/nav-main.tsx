"use client";

import { AuthContext } from "../../../features/auth/components/auth-context";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Link } from "react-router";
import React from "react";
import type { NavItem } from "./app-sidebar";

export function NavMain({ items }: { items: NavItem[] }) {
  const { center, user } = React.useContext(AuthContext);
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          if (!center && !user) {
            return null;
          }
          if (!center && !item.allowRole.includes(user!.role)) {
            return null;
          }
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
