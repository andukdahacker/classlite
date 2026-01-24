export default function TeacherDashboard() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Grading Queue</h1>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground italic">
          No submissions pending grading.
        </p>
      </div>
    </div>
  );
}
