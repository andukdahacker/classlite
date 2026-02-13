import { useAuth } from "@/features/auth/auth-context";
import { useExercises } from "@/features/exercises/hooks/use-exercises";
import { useClasses } from "@/features/logistics/hooks/use-logistics";
import { useUsers } from "@/features/users/users.api";
import type { ExerciseStatus } from "@workspace/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAssignments } from "../hooks/use-assignments";

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultExerciseId?: string;
}

type AssignTarget = "classes" | "students";

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  defaultExerciseId,
}: CreateAssignmentDialogProps) {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { createAssignment, isCreating } = useAssignments(centerId ?? undefined);
  const { exercises } = useExercises(centerId, { status: "PUBLISHED" as ExerciseStatus });
  const { classes } = useClasses(centerId ?? undefined);
  const { data: studentsData } = useUsers({ page: 1, limit: 100, role: "STUDENT" });

  const [exerciseId, setExerciseId] = useState(defaultExerciseId ?? "");
  const [assignTarget, setAssignTarget] = useState<AssignTarget>("classes");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [instructions, setInstructions] = useState("");

  const students = studentsData?.items ?? [];

  const resetForm = () => {
    setExerciseId(defaultExerciseId ?? "");
    setAssignTarget("classes");
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setDueDate("");
    setTimeLimit("");
    setInstructions("");
  };

  const handleSubmit = async () => {
    if (!exerciseId) {
      toast.error("Please select an exercise");
      return;
    }
    if (assignTarget === "classes" && selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    if (assignTarget === "students" && selectedStudentIds.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    if (dueDate && new Date(dueDate) < new Date()) {
      toast.error("Due date must be in the future");
      return;
    }
    if (timeLimit && (isNaN(Number(timeLimit)) || Number(timeLimit) <= 0)) {
      toast.error("Time limit must be a positive number");
      return;
    }

    try {
      await createAssignment({
        exerciseId,
        classIds: assignTarget === "classes" ? selectedClassIds : undefined,
        studentIds: assignTarget === "students" ? selectedStudentIds : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        timeLimit: timeLimit ? Number(timeLimit) * 60 : null, // convert minutes to seconds
        instructions: instructions || null,
      });
      const count = assignTarget === "classes" ? selectedClassIds.length : selectedStudentIds.length;
      const unit = assignTarget === "classes" ? "class(es)" : "student(s)";
      toast.success(`Assignment created for ${count} ${unit}`);
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create assignment");
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const publishedExercises = exercises.filter((e) => e.status === "PUBLISHED");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exercise picker */}
          <div className="space-y-2">
            <Label>Exercise</Label>
            <Select value={exerciseId} onValueChange={setExerciseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exercise..." />
              </SelectTrigger>
              <SelectContent>
                {publishedExercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.title} ({ex.skill})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target selection: Classes or Individual Students */}
          <div className="space-y-2">
            <Label>Assign to</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignTarget"
                  checked={assignTarget === "classes"}
                  onChange={() => { setAssignTarget("classes"); setSelectedStudentIds([]); }}
                />
                <span className="text-sm">Classes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignTarget"
                  checked={assignTarget === "students"}
                  onChange={() => { setAssignTarget("students"); setSelectedClassIds([]); }}
                />
                <span className="text-sm">Individual Students</span>
              </label>
            </div>
          </div>

          {/* Class selection */}
          {assignTarget === "classes" && (
            <div className="space-y-2">
              <Label>Classes</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes available</p>
                ) : (
                  classes.map((cls: { id: string; name: string; _count?: { students: number } }) => (
                    <label
                      key={cls.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(cls.id)}
                        onChange={() => toggleClass(cls.id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {cls.name}
                        {cls._count ? ` (${cls._count.students} students)` : ""}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedClassIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedClassIds.length} class(es) selected
                </p>
              )}
            </div>
          )}

          {/* Student selection */}
          {assignTarget === "students" && (
            <div className="space-y-2">
              <Label>Students</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students available</p>
                ) : (
                  students.map((student: { id: string; name: string | null; email: string | null }) => (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {student.name ?? student.email ?? student.id}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedStudentIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedStudentIds.length} student(s) selected
                </p>
              )}
            </div>
          )}

          {/* Due date */}
          <div className="space-y-2">
            <Label>Due Date (optional)</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Time limit */}
          <div className="space-y-2">
            <Label>Time Limit in minutes (optional)</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g., 60"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Instructions (optional)</Label>
            <Textarea
              placeholder="Additional instructions for students..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
            {assignTarget === "classes"
              ? `Assign to ${selectedClassIds.length || 0} class(es)`
              : `Assign to ${selectedStudentIds.length || 0} student(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
