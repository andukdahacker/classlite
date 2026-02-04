import type { ClassSession } from "@workspace/types";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Calendar, Clock, MapPin, Users, User, Trash2, ClipboardList } from "lucide-react";
import { RBACWrapper } from "@/features/auth/components/RBACWrapper";

type SessionWithDetails = ClassSession & {
  class?: {
    name: string;
    course?: { name: string; color?: string | null };
    teacher?: { id: string; name: string | null } | null;
    _count?: { students: number };
  };
};

interface SessionDetailsPopoverProps {
  session: SessionWithDetails;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDelete?: (sessionId: string) => void;
  isDeleting?: boolean;
  onMarkAttendance?: (session: SessionWithDetails) => void;
}

export function SessionDetailsPopover({
  session,
  children,
  open,
  onOpenChange,
  onDelete,
  isDeleting,
  onMarkAttendance,
}: SessionDetailsPopoverProps) {
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const courseColor = session.class?.course?.color ?? "#2563EB";
  const courseName = session.class?.course?.name ?? "Course";
  const className = session.class?.name ?? "Class";
  const teacherName = session.class?.teacher?.name ?? null;
  const studentCount = session.class?._count?.students ?? 0;

  // Calculate duration in minutes
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMins = Math.round(durationMs / (1000 * 60));
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Header with course color */}
          <div
            className="rounded-md p-3 -mx-1 -mt-1"
            style={{ backgroundColor: `${courseColor}15` }}
          >
            <h4
              className="font-semibold text-lg"
              style={{ color: courseColor }}
            >
              {courseName}
            </h4>
            <p className="text-sm text-muted-foreground">{className}</p>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={statusColors[session.status] ?? ""}
            >
              {session.status}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4" />
              <span>{format(startTime, "EEEE, MMMM d, yyyy")}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" />
              <span>
                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                <span className="ml-1 text-xs">({durationText})</span>
              </span>
            </div>

            {session.roomName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span>{session.roomName}</span>
              </div>
            )}

            {teacherName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" />
                <span>{teacherName}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              <span>{studentCount} {studentCount === 1 ? "Student" : "Students"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t">
            {/* Mark Attendance - Only for non-cancelled sessions */}
            {session.status !== "CANCELLED" && onMarkAttendance && (
              <RBACWrapper requiredRoles={["OWNER", "ADMIN", "TEACHER"]}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onMarkAttendance?.(session);
                    onOpenChange?.(false);
                  }}
                >
                  <ClipboardList className="size-4 mr-1" />
                  Mark Attendance
                </Button>
              </RBACWrapper>
            )}

            {/* Delete - Admin/Owner only */}
            <RBACWrapper requiredRoles={["OWNER", "ADMIN"]}>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this session?")) {
                    onDelete?.(session.id);
                  }
                }}
                disabled={isDeleting}
              >
                <Trash2 className="size-4 mr-1" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </RBACWrapper>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
