import { Book, Headphones, Mic, Pen, Clock, CalendarDays, Play } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import type { StudentAssignment } from "@workspace/types";

const SKILL_ICONS: Record<string, React.ReactNode> = {
  READING: <Book className="size-4" />,
  LISTENING: <Headphones className="size-4" />,
  WRITING: <Pen className="size-4" />,
  SPEAKING: <Mic className="size-4" />,
};

const SKILL_COLORS: Record<string, string> = {
  READING: "bg-blue-100 text-blue-700",
  LISTENING: "bg-purple-100 text-purple-700",
  WRITING: "bg-green-100 text-green-700",
  SPEAKING: "bg-orange-100 text-orange-700",
};

export function formatRelativeDue(dueDate: string | null): { text: string; className: string } {
  if (!dueDate) return { text: "No deadline", className: "" };
  const due = new Date(dueDate);
  const now = new Date();
  const isToday = due.toDateString() === now.toDateString();
  const isPast = due < now;
  if (isPast) return { text: "Overdue", className: "text-red-600 font-medium" };
  if (isToday) return { text: "Due today", className: "text-orange-600 font-medium" };
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return { text: "Due tomorrow", className: "text-orange-500" };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, className: "" };
  return { text: due.toLocaleDateString(), className: "" };
}

export function formatTimeLimit(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

interface AssignmentCardProps {
  assignment: StudentAssignment;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const skill = assignment.exercise.skill;
  const formattedDue = formatRelativeDue(assignment.dueDate);
  const formattedTime = formatTimeLimit(assignment.timeLimit);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("inline-flex items-center rounded-md px-2 py-1", SKILL_COLORS[skill] ?? "bg-gray-100 text-gray-700")}>
            {SKILL_ICONS[skill]}
          </span>
          <h3 className="font-medium truncate">{assignment.exercise.title}</h3>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          Not Started
          {/* TODO: Epic 4 — Replace stub with actual submission status */}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {assignment.dueDate && (
          <span className={cn("inline-flex items-center gap-1", formattedDue.className)}>
            <CalendarDays className="size-3.5" />
            {formattedDue.text}
          </span>
        )}
        {assignment.timeLimit && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formattedTime}
          </span>
        )}
        {assignment.class && (
          <span>{assignment.class.name}</span>
        )}
      </div>

      {assignment.instructions && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {assignment.instructions}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button size="sm" disabled>
                <Play className="size-3.5 mr-1" />
                Start
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Coming in Epic 4</TooltipContent>
        </Tooltip>
        {/* TODO: Epic 4 — Enable Start button, add Continue and View Results based on submission status */}
      </div>
    </div>
  );
}
