import { useAuth } from "@/features/auth/auth-context";
import { useStudentAssignments } from "../hooks/use-student-assignments";
import { AssignmentCard } from "./AssignmentCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { AlertCircle, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import type { StudentAssignment } from "@workspace/types";

type UrgencySection = {
  key: string;
  label: string;
  className: string;
  assignments: StudentAssignment[];
};

function groupByUrgency(assignments: StudentAssignment[]): UrgencySection[] {
  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const overdue: StudentAssignment[] = [];
  const dueToday: StudentAssignment[] = [];
  const dueThisWeek: StudentAssignment[] = [];
  const upcoming: StudentAssignment[] = [];
  const noDeadline: StudentAssignment[] = [];

  for (const a of assignments) {
    if (!a.dueDate) { noDeadline.push(a); continue; }
    const due = new Date(a.dueDate);
    if (due < now) overdue.push(a);
    else if (due <= todayEnd) dueToday.push(a);
    else if (due <= weekEnd) dueThisWeek.push(a);
    else upcoming.push(a);
  }

  return [
    { key: "overdue", label: "Overdue", className: "text-red-600", assignments: overdue },
    { key: "due-today", label: "Due Today", className: "text-orange-600", assignments: dueToday },
    { key: "due-this-week", label: "Due This Week", className: "", assignments: dueThisWeek },
    { key: "upcoming", label: "Upcoming", className: "", assignments: upcoming },
    { key: "no-deadline", label: "No Deadline", className: "text-muted-foreground", assignments: noDeadline },
  ];
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold">Failed to load assignments</h2>
      <p className="text-muted-foreground max-w-sm mt-2">
        Something went wrong. Please try refreshing the page.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">No assignments</h2>
      <p className="text-muted-foreground max-w-sm mt-2">
        You don't have any assignments right now. Check back later!
      </p>
    </div>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
      </div>
      <Skeleton className="h-6 w-32" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const [skillFilter, setSkillFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");

  const apiFilters = useMemo(() => {
    const f: { skill?: string; status?: "OPEN" | "CLOSED" } = {};
    if (skillFilter !== "ALL") f.skill = skillFilter;
    if (statusFilter !== "ALL") f.status = statusFilter as "OPEN" | "CLOSED";
    return f;
  }, [skillFilter, statusFilter]);

  const { assignments, isLoading, isError } = useStudentAssignments(centerId, apiFilters);

  const sections = useMemo(() => groupByUrgency(assignments), [assignments]);
  const hasAssignments = sections.some((s) => s.assignments.length > 0);

  if (isLoading) return <StudentDashboardSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Tasks</h1>
        <div className="flex gap-2">
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Skills" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Skills</SelectItem>
              <SelectItem value="READING">Reading</SelectItem>
              <SelectItem value="LISTENING">Listening</SelectItem>
              <SelectItem value="WRITING">Writing</SelectItem>
              <SelectItem value="SPEAKING">Speaking</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasAssignments ? (
        <EmptyState />
      ) : (
        sections.map((section) =>
          section.assignments.length > 0 ? (
            <div key={section.key}>
              <h2 className={cn("text-lg font-semibold mb-2", section.className)}>
                {section.label} ({section.assignments.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.assignments.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            </div>
          ) : null
        )
      )}
      {/* TODO: Story 3.16 enhancement — Mock test assignment cards when mock test assignment is supported */}
    </div>
  );
}
