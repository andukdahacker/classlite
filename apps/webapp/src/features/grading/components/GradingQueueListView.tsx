import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  CircleCheck,
  Clock,
  Loader2,
  Star,
} from "lucide-react";
import { useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { GradingQueueFilters } from "../hooks/use-grading-queue";
import { formatRelativeTime } from "../utils/format-time";

type GradingStatus = "pending_ai" | "ready" | "in_progress" | "graded";

interface GradingQueueItem {
  submissionId: string;
  studentName: string | null;
  assignmentTitle: string | null;
  className: string | null;
  submittedAt: string | null;
  dueDate: string | null;
  isPriority: boolean;
  gradingStatus: GradingStatus;
}

interface GradingQueueListViewProps {
  items: GradingQueueItem[];
  isLoading: boolean;
  filters: GradingQueueFilters;
  onFiltersChange: (filters: GradingQueueFilters) => void;
  onTogglePriority: (submissionId: string, isPriority: boolean) => void;
  onStartGrading: () => void;
}

const STATUS_BADGE: Record<
  GradingStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending_ai: {
    label: "Pending AI",
    className: "bg-yellow-50 text-yellow-700 border-yellow-300",
    icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
  },
  ready: {
    label: "Ready",
    className: "bg-green-50 text-green-700 border-green-300",
    icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-300",
    icon: <Clock className="mr-1 h-3 w-3" />,
  },
  graded: {
    label: "Graded",
    className: "",
    icon: <CircleCheck className="mr-1 h-3 w-3" />,
  },
};

function SortIcon({
  column,
  currentSort,
  currentOrder,
}: {
  column: string;
  currentSort: string;
  currentOrder: string;
}) {
  if (column !== currentSort) return null;
  return currentOrder === "asc" ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

export function GradingQueueListView({
  items,
  isLoading,
  filters,
  onFiltersChange,
  onTogglePriority,
  onStartGrading,
}: GradingQueueListViewProps) {
  const { centerId } = useParams<{ centerId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSort = filters.sortBy ?? "submittedAt";
  const currentOrder = filters.sortOrder ?? "asc";

  const handleSort = useCallback(
    (column: "submittedAt" | "dueDate" | "studentName") => {
      const newOrder =
        currentSort === column && currentOrder === "asc" ? "desc" : "asc";
      onFiltersChange({ ...filters, sortBy: column, sortOrder: newOrder });
    },
    [currentSort, currentOrder, filters, onFiltersChange],
  );

  const handleRowClick = useCallback(
    (submissionId: string) => {
      const params = searchParams.toString();
      navigate(`/${centerId}/dashboard/grading/${submissionId}${params ? `?${params}` : ""}`);
    },
    [centerId, navigate, searchParams],
  );

  const hasReadyOrInProgress = items.some(
    (i) => i.gradingStatus === "ready" || i.gradingStatus === "in_progress",
  );
  const hasInProgress = items.some((i) => i.gradingStatus === "in_progress");

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const hasActiveFilters =
      filters.classId ||
      filters.assignmentId ||
      filters.gradingStatus ||
      filters.status;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">
          {hasActiveFilters
            ? "No submissions match your filters"
            : "All caught up! No submissions to grade."}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() =>
              onFiltersChange({
                page: 1,
                limit: filters.limit,
                sortBy: "submittedAt",
                sortOrder: "asc",
              })
            }
          >
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-muted-foreground text-sm">
          {items.length} submission{items.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          disabled={!hasReadyOrInProgress}
          onClick={onStartGrading}
        >
          {hasInProgress ? "Continue Grading" : "Start Grading"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("studentName")}
            >
              Student
              <SortIcon
                column="studentName"
                currentSort={currentSort}
                currentOrder={currentOrder}
              />
            </TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("submittedAt")}
            >
              Submitted
              <SortIcon
                column="submittedAt"
                currentSort={currentSort}
                currentOrder={currentOrder}
              />
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none md:table-cell"
              onClick={() => handleSort("dueDate")}
            >
              Due
              <SortIcon
                column="dueDate"
                currentSort={currentSort}
                currentOrder={currentOrder}
              />
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const badge = STATUS_BADGE[item.gradingStatus];
            const isOverdue =
              item.dueDate && new Date(item.dueDate) < new Date();
            return (
              <TableRow
                key={item.submissionId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(item.submissionId)}
              >
                <TableCell className="w-10 px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePriority(item.submissionId, !item.isPriority);
                    }}
                  >
                    <Star
                      className={`h-4 w-4 ${item.isPriority ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                    />
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  {item.studentName ?? "Unknown"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{item.assignmentTitle}</span>
                    <span className="text-muted-foreground hidden text-xs md:inline">
                      {item.className}
                    </span>
                  </div>
                </TableCell>
                <TableCell title={item.submittedAt ?? undefined}>
                  {formatRelativeTime(item.submittedAt)}
                </TableCell>
                <TableCell
                  className={`hidden md:table-cell ${isOverdue ? "text-red-600" : ""}`}
                >
                  {item.dueDate
                    ? formatRelativeTime(item.dueDate)
                    : "No due date"}
                </TableCell>
                <TableCell>
                  {item.gradingStatus === "graded" ? (
                    <Badge variant="secondary">
                      {badge.icon}
                      {badge.label}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={badge.className}
                    >
                      {badge.icon}
                      {badge.label}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
