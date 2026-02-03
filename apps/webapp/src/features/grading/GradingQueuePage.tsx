import { GraduationCap } from "lucide-react";

export function GradingQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grading Queue</h1>
        <p className="text-muted-foreground">
          Review and grade student submissions.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <GraduationCap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Coming Soon</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          The grading workbench will be implemented in Epic 5. Stay tuned for
          AI-assisted grading with split-screen review.
        </p>
      </div>
    </div>
  );
}
