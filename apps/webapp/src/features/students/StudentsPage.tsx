import { Users } from "lucide-react";

export function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          View student health and performance metrics.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Coming Soon</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          The student health dashboard will be implemented in Epic 6. Monitor
          at-risk students with traffic light indicators.
        </p>
      </div>
    </div>
  );
}
