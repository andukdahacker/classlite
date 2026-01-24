export default function OwnerDashboard() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Center Health Overview</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Total Revenue</h3>
          <p className="text-3xl font-bold">$12,450</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">
            Active Students
          </h3>
          <p className="text-3xl font-bold">156</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-muted-foreground">
            Teacher Utilization
          </h3>
          <p className="text-3xl font-bold">84%</p>
        </div>
      </div>
    </div>
  );
}
