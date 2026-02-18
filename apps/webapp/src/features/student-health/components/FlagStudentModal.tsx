import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";
import { useCreateFlag } from "../hooks/use-student-flags";

interface FlagStudentModalProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlagStudentModal({
  studentId,
  open,
  onOpenChange,
}: FlagStudentModalProps) {
  const [note, setNote] = useState("");
  const createFlag = useCreateFlag(studentId);

  const handleSubmit = () => {
    createFlag.mutate(
      { studentId, note },
      {
        onSuccess: () => {
          toast.success("Student flagged — admin has been notified");
          setNote("");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to flag student. Please try again.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag Student for Admin</DialogTitle>
          <DialogDescription>
            Describe the concern so admin can follow up. This will notify all
            admins in your center.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="e.g., Parent meeting needed — student has been absent frequently..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="resize-none"
        />

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={note.length < 10 || createFlag.isPending}
          >
            {createFlag.isPending ? "Flagging..." : "Flag Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
