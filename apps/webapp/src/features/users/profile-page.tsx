import { useParams } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { useUser } from "./users.api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Loader2 } from "lucide-react";

export function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuth();

  // If userId param exists and is different from current user, fetch that user
  const isViewingOther = userId && userId !== currentUser?.id;
  const { data: fetchedUser, isLoading, error } = useUser(isViewingOther ? userId : undefined);

  // Use fetched user if viewing another user, otherwise use current user
  const displayUser = isViewingOther ? fetchedUser : currentUser;
  const isOwnProfile = !isViewingOther;

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

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            User not found or you don't have permission to view this profile.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displayUser) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{isOwnProfile ? "My Profile" : "User Profile"}</CardTitle>
          <CardDescription>
            {isOwnProfile ? "View your account information" : `Viewing ${displayUser.name || displayUser.email}'s profile`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={displayUser.avatarUrl ?? undefined} alt={displayUser.name ?? "User"} />
              <AvatarFallback className="text-2xl">
                {getInitials(displayUser.name, displayUser.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{displayUser.name || "User"}</h2>
              <p className="text-muted-foreground">{displayUser.email}</p>
              <Badge variant="secondary" className="capitalize">
                {displayUser.role?.toLowerCase()}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{displayUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{displayUser.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="capitalize">{displayUser.role?.toLowerCase()}</p>
            </div>
          </div>

          {isOwnProfile && (
            <p className="text-sm text-muted-foreground pt-4 border-t">
              Profile editing will be available in a future update.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
