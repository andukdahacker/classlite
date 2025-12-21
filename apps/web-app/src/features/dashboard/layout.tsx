import { AppSidebar } from "@/core/components/common/app-sidebar";
import { Separator } from "@workspace/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { Outlet } from "react-router";
import { AuthProvider } from "../auth/components/auth-provider";
import ThemeToggleButton from "@/core/components/common/theme-toggle-button";

export default function DashboardLayout() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center justify-between gap-2 px-4 w-full ">
              <div className="gap-2 items-center flex">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
              </div>
              <ThemeToggleButton />
            </div>
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
