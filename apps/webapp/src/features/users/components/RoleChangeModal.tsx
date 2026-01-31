import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";
import type { UserListItem, ChangeRoleRequest } from "@workspace/types";
import { useChangeRole } from "../users.api";

interface RoleChangeModalProps {
  user: UserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleDescriptions: Record<ChangeRoleRequest["role"], string> = {
  ADMIN: "Full access to center management, users, courses, and settings.",
  TEACHER: "Can manage their assigned classes, view schedules, and grade students.",
  STUDENT: "Can view their classes, schedules, and submit assignments.",
};

export function RoleChangeModal({ user, open, onOpenChange }: RoleChangeModalProps) {
  const [selectedRole, setSelectedRole] = useState<ChangeRoleRequest["role"]>(
    user.role === "OWNER" ? "ADMIN" : (user.role as ChangeRoleRequest["role"])
  );

  const changeRoleMutation = useChangeRole();

  const handleSubmit = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    try {
      await changeRoleMutation.mutateAsync({
        userId: user.id,
        role: selectedRole,
      });
      toast.success(`Role changed to ${selectedRole.toLowerCase()}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user.name || user.email}. This will affect their
            permissions immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ChangeRoleRequest["role"])}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Permission changes:</p>
            <p className="text-muted-foreground mt-1">
              {roleDescriptions[selectedRole]}
            </p>
          </div>

          {user.role !== selectedRole && (
            <div className="rounded-md border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm">
              <p className="text-yellow-800 dark:text-yellow-200">
                Changing from <strong>{user.role}</strong> to{" "}
                <strong>{selectedRole}</strong> will take effect immediately.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={changeRoleMutation.isPending || selectedRole === user.role}
          >
            {changeRoleMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
