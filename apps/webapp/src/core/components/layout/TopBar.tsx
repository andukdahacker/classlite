import { useTenant } from "@/features/tenants/tenant-context";
import { OfflineIndicator } from "./OfflineIndicator";
import { GalleryVerticalEnd } from "lucide-react";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export function TopBar() {
  const { tenant } = useTenant();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 mr-2 md:flex hidden" />
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-6 w-6 rounded"
            />
          ) : (
            <GalleryVerticalEnd className="h-4 w-4" />
          )}
        </div>
        <span className="text-lg font-semibold tracking-tight">
          {tenant?.name || "ClassLite"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <OfflineIndicator />
      </div>
    </header>
  );
}
