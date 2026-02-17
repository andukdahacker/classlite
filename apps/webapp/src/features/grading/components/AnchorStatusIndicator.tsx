import { Unlink } from "lucide-react";
import type { AnchorStatus } from "../hooks/use-anchor-validation";

interface AnchorStatusIndicatorProps {
  anchorStatus: AnchorStatus;
  variant: "dot" | "label";
}

export function AnchorStatusIndicator({ anchorStatus, variant }: AnchorStatusIndicatorProps) {
  if (variant === "dot" && anchorStatus === "drifted") {
    return (
      <span
        className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400"
        title="Text has changed slightly since analysis"
      />
    );
  }

  if (variant === "label" && anchorStatus === "orphaned") {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Unlink className="h-3 w-3" />
        <span>Anchor lost — text changed since analysis</span>
      </div>
    );
  }

  return null;
}
