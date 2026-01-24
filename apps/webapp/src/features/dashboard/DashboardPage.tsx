import { Suspense, lazy } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { DashboardShell } from "@/core/components/layout/DashboardShell";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useOutlet } from "react-router";

const OwnerDashboard = lazy(() => import("./components/OwnerDashboard"));
const TeacherDashboard = lazy(() => import("./components/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./components/StudentDashboard"));

export default function DashboardPage() {
  const { user } = useAuth();
  const outlet = useOutlet();

  // If we have a nested match (outlet), render it
  // Otherwise render the default role-based dashboard
  const isDefaultDashboard = !outlet;

  const renderDashboard = () => {
    if (!isDefaultDashboard) {
      return outlet;
    }

    switch (user?.role) {
      case "OWNER":
        return <OwnerDashboard />;
      case "TEACHER":
        return <TeacherDashboard />;
      case "STUDENT":
        return <StudentDashboard />;
      default:
        return (
          <div className="flex h-[50vh] items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Unknown Role</h2>
              <p className="text-muted-foreground">
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardShell>
      <Suspense fallback={<DashboardSkeleton />}>{renderDashboard()}</Suspense>
    </DashboardShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
