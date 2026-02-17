import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { X } from "lucide-react";
import type { GradingQueueFilters } from "../hooks/use-grading-queue";

interface QueueFiltersProps {
  filters: GradingQueueFilters;
  onFiltersChange: (filters: GradingQueueFilters) => void;
  classOptions: { id: string; name: string }[];
  assignmentOptions: { id: string; title: string }[];
}

const STATUS_OPTIONS = [
  { value: "pending_ai", label: "Pending AI" },
  { value: "ready", label: "Ready" },
  { value: "in_progress", label: "In Progress" },
  { value: "graded", label: "Graded" },
];

export function QueueFilters({
  filters,
  onFiltersChange,
  classOptions,
  assignmentOptions,
}: QueueFiltersProps) {
  const hasActiveFilters = !!(
    filters.classId ||
    filters.assignmentId ||
    filters.gradingStatus
  );

  return (
    <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-4 py-2">
      <Select
        value={filters.classId ?? "__all__"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            classId: value === "__all__" ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Classes</SelectItem>
          {classOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assignmentId ?? "__all__"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            assignmentId: value === "__all__" ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Assignments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Assignments</SelectItem>
          {assignmentOptions.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.gradingStatus ?? "__all__"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            gradingStatus:
              value === "__all__"
                ? undefined
                : (value as GradingQueueFilters["gradingStatus"]),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onFiltersChange({
              page: 1,
              limit: filters.limit,
              sortBy: filters.sortBy,
              sortOrder: filters.sortOrder,
            })
          }
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
