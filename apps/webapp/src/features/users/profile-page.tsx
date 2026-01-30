import { useAuth } from "@/features/auth/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";

export function ProfilePage() {
  const { user } = useAuth();

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

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            View your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{user.name || "User"}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="capitalize">
                {user.role?.toLowerCase()}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{user.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="capitalize">{user.role?.toLowerCase()}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground pt-4 border-t">
            Profile editing will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
