import { ExerciseTable } from "@/lib/features/exercises/components/exercise-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <span className="text-2xl font-bold">Exercises</span>
        <span>Manage your exercises</span>
      </div>

      <ExerciseTable />
    </div>
  );
}
