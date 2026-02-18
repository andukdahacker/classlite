import { useState } from "react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useStudentFlags, useResolveFlag } from "../hooks/use-student-flags";
import type { StudentFlagRecord } from "@workspace/types";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  ACKNOWLEDGED: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
};

function FlagItem({
  flag,
  isAdmin,
  onResolve,
  isResolving,
}: {
  flag: StudentFlagRecord;
  isAdmin: boolean;
  onResolve: (flagId: string, resolvedNote: string) => void;
  isResolving: boolean;
}) {
  const [resolveNote, setResolveNote] = useState("");
  const [showResolve, setShowResolve] = useState(false);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {flag.createdByName ?? "Unknown"}
            </span>
            <Badge
              className={`text-xs ${STATUS_STYLES[flag.status] ?? ""}`}
              variant="secondary"
            >
              {flag.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(flag.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm mt-1">{flag.note}</p>
          {flag.resolvedNote && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Resolution: {flag.resolvedNote}
            </p>
          )}
        </div>
      </div>
      {isAdmin && flag.status === "OPEN" && (
        <div className="mt-2">
          {showResolve ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Resolution note (optional)"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={() => onResolve(flag.id, resolveNote)}
                disabled={isResolving}
              >
                {isResolving ? "..." : "Resolve"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowResolve(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResolve(true)}
            >
              Resolve
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface StudentFlagsSectionProps {
  studentId: string;
  isAdmin?: boolean;
}

export function StudentFlagsSection({
  studentId,
  isAdmin = false,
}: StudentFlagsSectionProps) {
  const { flags, isLoading } = useStudentFlags(studentId);
  const resolveFlag = useResolveFlag(studentId);

  const handleResolve = (flagId: string, resolvedNote: string) => {
    resolveFlag.mutate(
      { flagId, resolvedNote: resolvedNote || undefined },
      {
        onSuccess: () => {
          toast.success("Flag resolved");
        },
        onError: () => {
          toast.error("Failed to resolve flag");
        },
      },
    );
  };

  if (isLoading) return null;

  const openFlags = flags.filter((f) => f.status === "OPEN");

  if (openFlags.length === 0 && !isAdmin) return null;

  const displayFlags = isAdmin ? flags : openFlags;

  if (displayFlags.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="h-4 w-4 text-orange-600" />
        <h3 className="text-sm font-semibold text-orange-800">
          Student Flags ({openFlags.length} open)
        </h3>
      </div>
      <div className="space-y-2">
        {displayFlags.map((flag) => (
          <FlagItem
            key={flag.id}
            flag={flag}
            isAdmin={isAdmin}
            onResolve={handleResolve}
            isResolving={resolveFlag.isPending}
          />
        ))}
      </div>
    </div>
  );
}
