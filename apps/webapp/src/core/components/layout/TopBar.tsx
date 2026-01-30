import { useTenant } from "@/features/tenants/tenant-context";
import { useAuth } from "@/features/auth/auth-context";
import { OfflineIndicator } from "./OfflineIndicator";
import { GalleryVerticalEnd, LogOut, User, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { useNavigate } from "react-router";
import { useCallback } from "react";

export function TopBar() {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/sign-in", { replace: true });
  }, [logout, navigate]);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

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
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 px-2 gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-sm font-medium max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.role?.toLowerCase()}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/${user.centerId}/profile`)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
