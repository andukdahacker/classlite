import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@workspace/ui/components/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { AttendanceSheet } from "./AttendanceSheet";
import { useSessionAttendance, useBulkAttendance } from "../hooks/use-attendance";
import type { ClassSession } from "@workspace/types";
import { format } from "date-fns";

interface AttendanceModalProps {
  session: ClassSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceModal({ session, open, onOpenChange }: AttendanceModalProps) {
  const [confirmAction, setConfirmAction] = useState<"PRESENT" | "ABSENT" | null>(null);

  // Only fetch attendance data when we have a valid session
  const sessionId = session?.id ?? null;
  const { data } = useSessionAttendance(sessionId);
  const bulkMutation = useBulkAttendance(sessionId);

  const studentCount = data?.students.length ?? 0;

  if (!session) {
    return null;
  }

  const startTime = new Date(session.startTime);
  const courseName = session.class?.course?.name ?? "Course";
  const className = session.class?.name ?? "Class";

  const handleBulkAction = (status: "PRESENT" | "ABSENT") => {
    bulkMutation.mutate(status);
    setConfirmAction(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Mark Attendance</SheetTitle>
          <SheetDescription>
            {courseName} - {className} ({format(startTime, "MMM d, yyyy")})
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-4 px-4">
          <AttendanceSheet sessionId={session.id} />
        </ScrollArea>

        <SheetFooter className="flex-shrink-0 flex-row gap-2 border-t pt-4">
          {/* Mark All Present */}
          <AlertDialog
            open={confirmAction === "PRESENT"}
            onOpenChange={(open) => !open && setConfirmAction(null)}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={bulkMutation.isPending || studentCount === 0}
                onClick={() => setConfirmAction("PRESENT")}
                className="flex-1"
              >
                Mark All Present
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark All Present?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark all {studentCount} students as Present. This action
                  can be undone by changing individual statuses.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleBulkAction("PRESENT")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Mark All Absent */}
          <AlertDialog
            open={confirmAction === "ABSENT"}
            onOpenChange={(open) => !open && setConfirmAction(null)}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={bulkMutation.isPending || studentCount === 0}
                onClick={() => setConfirmAction("ABSENT")}
                className="flex-1"
              >
                Mark All Absent
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark All Absent?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark all {studentCount} students as Absent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleBulkAction("ABSENT")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
