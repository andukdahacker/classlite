import { useState, useEffect, useMemo } from "react";
import type { HealthStatus } from "@workspace/types";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { Search } from "lucide-react";
import { useStudentHealthDashboard } from "../hooks/use-student-health-dashboard";
import { HealthSummaryBar } from "./HealthSummaryBar";
import { StudentHealthCardComponent } from "./StudentHealthCard";

export function StudentHealthDashboard() {
  const [classId, setClassId] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HealthStatus | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      ...(classId ? { classId } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [classId, debouncedSearch],
  );

  const { students, summary, isLoading, isError, refetch } =
    useStudentHealthDashboard(filters);

  // Extract unique classes from response for class filter dropdown
  const availableClasses = useMemo(() => {
    const classMap = new Map<string, string>();
    for (const student of students) {
      for (const cls of student.classes) {
        classMap.set(cls.id, cls.name);
      }
    }
    return Array.from(classMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  // Client-side filter by status (from summary bar clicks)
  const filteredStudents = statusFilter
    ? students.filter((s) => s.healthStatus === statusFilter)
    : students;

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Student Health</h1>
          <p className="text-muted-foreground">
            At-a-glance view of student engagement
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Failed to load student health data. Please try again.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Student Health</h1>
        <p className="text-muted-foreground">
          At-a-glance view of student engagement
        </p>
      </div>

      {/* Summary bar */}
      <HealthSummaryBar
        summary={summary}
        isLoading={isLoading}
        onFilterClick={(status) =>
          setStatusFilter(status === statusFilter ? null : status)
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={classId ?? "all"}
          onValueChange={(v) => setClassId(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {availableClasses.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {students.length === 0 && !debouncedSearch && !classId
              ? "No students enrolled yet. Invite students to your center to see their health status."
              : "No students match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentHealthCardComponent key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
