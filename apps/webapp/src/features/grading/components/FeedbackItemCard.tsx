import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  SpellCheck,
  BookOpen,
  Link,
  Star,
  MessageCircle,
} from "lucide-react";
import { AnchorStatusIndicator } from "./AnchorStatusIndicator";
import React, { useCallback, useRef } from "react";
import type { AnchorStatus } from "../hooks/use-anchor-validation";

type FeedbackType =
  | "grammar"
  | "vocabulary"
  | "coherence"
  | "score_suggestion"
  | "general";
type Severity = "error" | "warning" | "suggestion";

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  content: string;
  suggestedFix?: string | null;
  severity?: Severity | null;
  confidence?: number | null;
  originalContextSnippet?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
}

const TYPE_ICONS: Record<FeedbackType, React.ElementType> = {
  grammar: SpellCheck,
  vocabulary: BookOpen,
  coherence: Link,
  score_suggestion: Star,
  general: MessageCircle,
};

const SEVERITY_STYLES: Record<
  Severity,
  { variant: "destructive" | "outline" | "secondary"; className?: string }
> = {
  error: { variant: "destructive" },
  warning: { variant: "outline", className: "border-amber-400 text-amber-600" },
  suggestion: { variant: "secondary" },
};

const HIGHLIGHT_RING: Record<Severity, string> = {
  error: "ring-2 ring-red-500",
  warning: "ring-2 ring-amber-500",
  suggestion: "ring-2 ring-primary",
};

interface FeedbackItemCardProps {
  item: FeedbackItem;
  anchorStatus?: AnchorStatus;
  isHighlighted?: boolean;
  onHighlight?: (id: string | null, debounce?: boolean) => void;
}

function FeedbackItemCardInner({
  item,
  anchorStatus = "no-anchor",
  isHighlighted = false,
  onHighlight,
}: FeedbackItemCardProps) {
  const Icon = TYPE_ICONS[item.type] ?? MessageCircle;
  const severityStyle = item.severity
    ? SEVERITY_STYLES[item.severity]
    : SEVERITY_STYLES.suggestion;

  const severity = (item.severity ?? "suggestion") as Severity;
  const hasAnchor = anchorStatus === "valid" || anchorStatus === "drifted";
  const isOrphaned = anchorStatus === "orphaned";
  const touchActiveRef = useRef(false);
  const suppressMouseRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (suppressMouseRef.current) return;
    if (hasAnchor && onHighlight) onHighlight(item.id, true);
  }, [hasAnchor, onHighlight, item.id]);

  const handleMouseLeave = useCallback(() => {
    if (suppressMouseRef.current) return;
    if (hasAnchor && onHighlight) onHighlight(null, true);
  }, [hasAnchor, onHighlight]);

  const handleFocus = useCallback(() => {
    if (hasAnchor && onHighlight) onHighlight(item.id, false);
  }, [hasAnchor, onHighlight, item.id]);

  const handleBlur = useCallback(() => {
    if (hasAnchor && onHighlight) onHighlight(null, false);
  }, [hasAnchor, onHighlight]);

  const handleTouchStart = useCallback(
    () => {
      if (!hasAnchor || !onHighlight) return;
      touchActiveRef.current = !touchActiveRef.current;
      onHighlight(touchActiveRef.current ? item.id : null, false);
      // Suppress synthetic mouse events that follow touch
      suppressMouseRef.current = true;
      setTimeout(() => { suppressMouseRef.current = false; }, 400);
    },
    [hasAnchor, onHighlight, item.id],
  );

  // Build aria-label
  const confidenceStr =
    item.confidence != null ? `, confidence ${Math.round(item.confidence * 100)}%` : "";
  const anchorStr = isOrphaned
    ? ", anchor lost"
    : hasAnchor
      ? ", anchored to text"
      : "";
  const ariaLabel = `${item.type.replace("_", " ")} ${severity}: ${item.content}${confidenceStr}${anchorStr}`;

  const highlightRing = isHighlighted ? HIGHLIGHT_RING[severity] : "";
  const orphanedOpacity = isOrphaned ? "opacity-75" : "";

  return (
    <Card
      className={`border-l-2 border-l-muted-foreground/20 transition-shadow duration-150 ${highlightRing} ${orphanedOpacity}`}
      data-card-id={item.id}
      tabIndex={0}
      aria-label={ariaLabel}
      aria-details={hasAnchor ? `anchor-${item.id}` : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <AnchorStatusIndicator anchorStatus={anchorStatus} variant="dot" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm leading-relaxed">{item.content}</p>

            {item.suggestedFix && item.originalContextSnippet && (
              <p className="text-xs text-muted-foreground">
                <del className="text-destructive/70">
                  {item.originalContextSnippet}
                </del>
                {" → "}
                <ins className="text-green-600 no-underline font-medium">
                  {item.suggestedFix}
                </ins>
              </p>
            )}

            <div className="flex items-center gap-2">
              {item.severity && (
                <Badge
                  variant={severityStyle.variant}
                  className={severityStyle.className}
                >
                  {item.severity}
                </Badge>
              )}
              {item.confidence != null && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(item.confidence * 100)}%
                </span>
              )}
            </div>

            <AnchorStatusIndicator anchorStatus={anchorStatus} variant="label" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const FeedbackItemCard = React.memo(FeedbackItemCardInner);
