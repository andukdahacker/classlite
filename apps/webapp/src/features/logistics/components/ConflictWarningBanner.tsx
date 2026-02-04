import { AlertTriangle, Clock, DoorOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { RBACWrapper } from "@/features/auth/components/RBACWrapper";
import type { ConflictingSession, Suggestion } from "@workspace/types";
import { format } from "date-fns";

interface ConflictWarningBannerProps {
  roomConflicts: ConflictingSession[];
  teacherConflicts: ConflictingSession[];
  suggestions?: Suggestion[];
  onApplySuggestion?: (suggestion: Suggestion) => void;
  onForceSave?: () => void;
  isForcing?: boolean;
}

export function ConflictWarningBanner({
  roomConflicts,
  teacherConflicts,
  suggestions = [],
  onApplySuggestion,
  onForceSave,
  isForcing,
}: ConflictWarningBannerProps) {
  const hasConflicts = roomConflicts.length > 0 || teacherConflicts.length > 0;

  if (!hasConflicts) {
    return null;
  }

  const timeSuggestions = suggestions.filter((s) => s.type === "time");
  const roomSuggestions = suggestions.filter((s) => s.type === "room");

  return (
    <Alert variant="destructive" className="mb-4 border-amber-500 bg-amber-50">
      <AlertTriangle className="size-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Scheduling Conflicts Detected</AlertTitle>
      <AlertDescription className="space-y-3">
        {/* Room Conflicts */}
        {roomConflicts.length > 0 && (
          <div className="space-y-1">
            <p className="flex items-center gap-1 font-medium text-amber-800">
              <DoorOpen className="size-3" />
              Room Double-Booking:
            </p>
            <ul className="ml-4 space-y-1 text-sm text-amber-700">
              {roomConflicts.map((conflict) => (
                <li key={conflict.id}>
                  <span className="font-medium">{conflict.roomName}</span> is booked for{" "}
                  <span className="font-medium">
                    {conflict.courseName} - {conflict.className}
                  </span>{" "}
                  at {format(new Date(conflict.startTime), "h:mm a")} -{" "}
                  {format(new Date(conflict.endTime), "h:mm a")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Teacher Conflicts */}
        {teacherConflicts.length > 0 && (
          <div className="space-y-1">
            <p className="flex items-center gap-1 font-medium text-amber-800">
              <Clock className="size-3" />
              Teacher Double-Booking:
            </p>
            <ul className="ml-4 space-y-1 text-sm text-amber-700">
              {teacherConflicts.map((conflict) => (
                <li key={conflict.id}>
                  <span className="font-medium">{conflict.teacherName ?? "Teacher"}</span>{" "}
                  is scheduled for{" "}
                  <span className="font-medium">
                    {conflict.courseName} - {conflict.className}
                  </span>{" "}
                  at {format(new Date(conflict.startTime), "h:mm a")} -{" "}
                  {format(new Date(conflict.endTime), "h:mm a")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {(timeSuggestions.length > 0 || roomSuggestions.length > 0) && (
          <div className="space-y-2 pt-2 border-t border-amber-300">
            <p className="font-medium text-amber-800">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {timeSuggestions.map((suggestion, idx) => (
                <Button
                  key={`time-${idx}`}
                  variant="outline"
                  size="sm"
                  className="border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
                  onClick={() => onApplySuggestion?.(suggestion)}
                >
                  <Clock className="mr-1 size-3" />
                  {suggestion.value}
                </Button>
              ))}
              {roomSuggestions.map((suggestion, idx) => (
                <Button
                  key={`room-${idx}`}
                  variant="outline"
                  size="sm"
                  className="border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
                  onClick={() => onApplySuggestion?.(suggestion)}
                >
                  <DoorOpen className="mr-1 size-3" />
                  Use {suggestion.value}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Force Save Button (RBAC protected - only OWNER/ADMIN) */}
        <RBACWrapper requiredRoles={["OWNER", "ADMIN"]}>
          <div className="pt-2 border-t border-amber-300">
            <Button
              variant="destructive"
              size="sm"
              onClick={onForceSave}
              disabled={isForcing}
            >
              {isForcing ? "Saving..." : "Force Save (Override Conflict)"}
            </Button>
          </div>
        </RBACWrapper>
      </AlertDescription>
    </Alert>
  );
}
