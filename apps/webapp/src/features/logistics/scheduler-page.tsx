import { useState } from "react";
import { startOfWeek } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useSessions } from "./hooks/use-sessions";
import { useClasses } from "./hooks/use-logistics";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { CreateSessionDialog } from "./components/CreateSessionDialog";
import { Button } from "@workspace/ui/components/button";
import { RBACWrapper } from "@/features/auth/components/RBACWrapper";

export function SchedulerPage() {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const {
    sessions,
    isLoading,
    weekStart,
    weekEnd,
    createSession,
    isCreating,
    updateSession,
    isUpdating,
    deleteSession,
    isDeleting,
    generateSessions,
    isGenerating,
  } = useSessions(user?.centerId, currentWeekStart);

  const { classes } = useClasses(user?.centerId ?? undefined);

  const handleWeekChange = (newWeekStart: Date) => {
    setCurrentWeekStart(newWeekStart);
  };

  const handleSessionMove = async (
    sessionId: string,
    newStartTime: Date,
    newEndTime: Date
  ) => {
    try {
      await updateSession({
        id: sessionId,
        input: {
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        },
      });
      toast.success("Session rescheduled successfully");
    } catch (error) {
      toast.error("Failed to reschedule session");
      console.error("Failed to move session:", error);
    }
  };

  const handleGenerateSessions = async () => {
    try {
      const result = await generateSessions({
        startDate: weekStart,
        endDate: weekEnd,
      });
      toast.success(`Generated ${result?.generatedCount ?? 0} sessions`);
    } catch (error) {
      toast.error("Failed to generate sessions");
      console.error("Failed to generate sessions:", error);
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast.success("Session deleted");
    } catch (error) {
      toast.error("Failed to delete session");
      console.error("Failed to delete session:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            View and manage your class sessions
          </p>
        </div>
        <RBACWrapper requiredRoles={["OWNER", "ADMIN"]}>
          <div className="flex items-center gap-2">
            <CreateSessionDialog
              classes={classes}
              onCreateSession={createSession}
              isCreating={isCreating}
            />
            <Button
              onClick={handleGenerateSessions}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Sessions"
              )}
            </Button>
          </div>
        </RBACWrapper>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden bg-card">
        <WeeklyCalendar
          sessions={sessions}
          weekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          onSessionMove={handleSessionMove}
          onSessionDelete={handleSessionDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}

export default SchedulerPage;
