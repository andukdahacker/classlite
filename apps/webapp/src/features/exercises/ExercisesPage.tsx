import { Library } from "lucide-react";

export function ExercisesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
        <p className="text-muted-foreground">
          Create and manage IELTS exercises for your students.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Library className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Coming Soon</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          The IELTS Exercise Builder will be implemented in Epic 3. Create
          reading, listening, writing, and speaking exercises with AI-assisted
          content generation.
        </p>
      </div>
    </div>
  );
}
