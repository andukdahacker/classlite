import { useAuth } from "@/features/auth/auth-context";
import type { Assignment } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAssignments } from "../hooks/use-assignments";

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
}

export function EditAssignmentDialog({
  open,
  onOpenChange,
  assignment,
}: EditAssignmentDialogProps) {
  const { user } = useAuth();
  const centerId = user?.centerId;
  const { updateAssignment, isUpdating } = useAssignments(centerId ?? undefined);

  const [dueDate, setDueDate] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (assignment) {
      setDueDate(
        assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().slice(0, 16)
          : "",
      );
      setTimeLimit(assignment.timeLimit ? String(Math.floor(assignment.timeLimit / 60)) : "");
      setInstructions(assignment.instructions ?? "");
    }
  }, [assignment]);

  const handleSubmit = async () => {
    if (timeLimit && (isNaN(Number(timeLimit)) || Number(timeLimit) <= 0)) {
      toast.error("Time limit must be a positive number");
      return;
    }

    try {
      await updateAssignment({
        id: assignment.id,
        input: {
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          timeLimit: timeLimit ? Number(timeLimit) * 60 : null,
          instructions: instructions || null,
        },
      });
      toast.success("Assignment updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update assignment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{assignment?.exercise?.title}</p>
            <p className="text-xs text-muted-foreground">
              {assignment?.class?.name ?? "Individual assignment"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Time Limit (minutes)</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g., 60"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea
              placeholder="Additional instructions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
