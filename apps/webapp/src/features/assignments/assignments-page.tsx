import { useAuth } from "@/features/auth/auth-context";
import type { Assignment, AssignmentStatus } from "@workspace/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Book,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  Mic,
  MoreHorizontal,
  Pen,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAssignments } from "./hooks/use-assignments";
import { CreateAssignmentDialog } from "./components/create-assignment-dialog";
import { EditAssignmentDialog } from "./components/edit-assignment-dialog";

const PAGE_SIZE = 20;

const STATUS_VARIANTS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
};

const SKILL_ICONS: Record<string, React.ReactNode> = {
  READING: <Book className="size-4" />,
  LISTENING: <Headphones className="size-4" />,
  WRITING: <Pen className="size-4" />,
  SPEAKING: <Mic className="size-4" />,
};

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return { text: "No deadline", className: "" };
  const due = new Date(dueDate);
  const now = new Date();
  const isToday = due.toDateString() === now.toDateString();
  const isPast = due < now;
  if (isPast) return { text: "Overdue", className: "text-red-600 font-medium" };
  if (isToday) return { text: "Due today", className: "text-orange-600 font-medium" };
  return { text: due.toLocaleDateString(), className: "" };
}

function formatTimeLimit(seconds: number | null) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "ALL">("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [skillFilter, setSkillFilter] = useState<string>("ALL");
  const [dueDateStart, setDueDateStart] = useState("");
  const [dueDateEnd, setDueDateEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [closeTarget, setCloseTarget] = useState<Assignment | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Assignment | null>(null);
  const [reopenTarget, setReopenTarget] = useState<Assignment | null>(null);
  const [reopenDueDate, setReopenDueDate] = useState("");

  const apiFilters = useMemo(() => {
    const f: {
      status?: AssignmentStatus;
      skill?: string;
      classId?: string;
      dueDateStart?: string;
      dueDateEnd?: string;
    } = {};
    if (statusFilter !== "ALL") f.status = statusFilter;
    if (skillFilter !== "ALL") f.skill = skillFilter;
    if (classFilter !== "ALL") f.classId = classFilter;
    if (dueDateStart) f.dueDateStart = new Date(dueDateStart).toISOString();
    if (dueDateEnd) f.dueDateEnd = new Date(dueDateEnd).toISOString();
    return f;
  }, [statusFilter, skillFilter, classFilter, dueDateStart, dueDateEnd]);

  const {
    assignments,
    isLoading,
    closeAssignment,
    isClosing,
    reopenAssignment,
    isReopening,
    archiveAssignment,
    isArchiving,
    deleteAssignment,
    isDeleting,
  } = useAssignments(centerId, apiFilters);

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter((a: Assignment) =>
      a.exercise?.title?.toLowerCase().includes(q),
    );
  }, [assignments, searchQuery]);

  const totalPages = Math.ceil(filteredAssignments.length / PAGE_SIZE);
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Extract unique classes from assignments for filter
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assignments) {
      if (a.class) map.set(a.class.id, a.class.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [assignments]);

  const handleClose = async () => {
    if (!closeTarget) return;
    try {
      await closeAssignment(closeTarget.id);
      toast.success("Assignment closed");
    } catch {
      toast.error("Failed to close assignment");
    }
    setCloseTarget(null);
  };

  const handleReopen = async () => {
    if (!reopenTarget) return;
    try {
      await reopenAssignment({
        id: reopenTarget.id,
        input: reopenDueDate ? { dueDate: new Date(reopenDueDate).toISOString() } : {},
      });
      toast.success("Assignment reopened");
    } catch {
      toast.error("Failed to reopen assignment");
    }
    setReopenTarget(null);
    setReopenDueDate("");
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveAssignment(archiveTarget.id);
      toast.success("Assignment archived");
    } catch {
      toast.error("Failed to archive assignment");
    }
    setArchiveTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAssignment(deleteTarget.id);
      toast.success("Assignment deleted");
    } catch {
      toast.error("Failed to delete assignment");
    }
    setDeleteTarget(null);
  };

  const renderActionMenu = (assignment: Assignment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {assignment.status !== "ARCHIVED" && (
          <DropdownMenuItem onClick={() => setEditTarget(assignment)}>
            Edit
          </DropdownMenuItem>
        )}
        {assignment.status === "OPEN" && (
          <DropdownMenuItem onClick={() => setCloseTarget(assignment)}>
            Close
          </DropdownMenuItem>
        )}
        {(assignment.status === "CLOSED" || assignment.status === "ARCHIVED") && (
          <DropdownMenuItem onClick={() => { setReopenTarget(assignment); setReopenDueDate(""); }}>
            Reopen
          </DropdownMenuItem>
        )}
        {assignment.status !== "ARCHIVED" && (
          <DropdownMenuItem onClick={() => setArchiveTarget(assignment)}>
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => setDeleteTarget(assignment)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Assign Exercise
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by exercise title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as AssignmentStatus | "ALL");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={classFilter}
          onValueChange={(v) => {
            setClassFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classes</SelectItem>
            {classOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={skillFilter}
          onValueChange={(v) => {
            setSkillFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Skills</SelectItem>
            <SelectItem value="READING">Reading</SelectItem>
            <SelectItem value="LISTENING">Listening</SelectItem>
            <SelectItem value="WRITING">Writing</SelectItem>
            <SelectItem value="SPEAKING">Speaking</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dueDateStart}
            onChange={(e) => { setDueDateStart(e.target.value); setCurrentPage(1); }}
            className="w-[140px]"
            placeholder="From"
            aria-label="Due date from"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dueDateEnd}
            onChange={(e) => { setDueDateEnd(e.target.value); setCurrentPage(1); }}
            className="w-[140px]"
            placeholder="To"
            aria-label="Due date to"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Time Limit</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {assignments.length === 0
                    ? "No assignments yet. Click \"Assign Exercise\" to create one."
                    : "No assignments match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedAssignments.map((assignment: Assignment) => {
                const due = formatDueDate(assignment.dueDate);
                return (
                  <TableRow
                    key={assignment.id}
                    className={cn(assignment.status === "ARCHIVED" && "opacity-60")}
                  >
                    <TableCell className="font-medium">{assignment.exercise?.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {SKILL_ICONS[assignment.exercise?.skill]}
                        <span className="text-sm">{assignment.exercise?.skill}</span>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.class?.name ?? "Individual"}</TableCell>
                    <TableCell>
                      <span className={due.className}>{due.text}</span>
                    </TableCell>
                    <TableCell>{formatTimeLimit(assignment.timeLimit)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {/* TODO: Epic 4 — Replace 0 with actual submission count */}
                      0/{assignment._count?.studentAssignments ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_VARIANTS[assignment.status])}>
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {renderActionMenu(assignment)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateAssignmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editTarget && (
        <EditAssignmentDialog
          open={!!editTarget}
          onOpenChange={(open: boolean) => !open && setEditTarget(null)}
          assignment={editTarget}
        />
      )}

      {/* Close confirmation */}
      <AlertDialog open={!!closeTarget} onOpenChange={(open) => !open && setCloseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Close this assignment? Students will no longer be able to submit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={isClosing}>
              {isClosing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Archive this assignment? It can be reopened later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen dialog with optional due date */}
      <Dialog open={!!reopenTarget} onOpenChange={(open) => { if (!open) { setReopenTarget(null); setReopenDueDate(""); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reopen Assignment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Reopen this assignment? Students will be able to submit again.
          </p>
          <div className="space-y-2 py-2">
            <Label>New Due Date (optional)</Label>
            <Input
              type="datetime-local"
              value={reopenDueDate}
              onChange={(e) => setReopenDueDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to keep the original due date.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReopenTarget(null); setReopenDueDate(""); }}>
              Cancel
            </Button>
            <Button onClick={handleReopen} disabled={isReopening}>
              {isReopening ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
