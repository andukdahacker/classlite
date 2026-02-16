import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  SpellCheck,
  BookOpen,
  Link,
  Star,
  MessageCircle,
} from "lucide-react";

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

interface FeedbackItemCardProps {
  item: FeedbackItem;
}

export function FeedbackItemCard({ item }: FeedbackItemCardProps) {
  const Icon = TYPE_ICONS[item.type] ?? MessageCircle;
  const severityStyle = item.severity
    ? SEVERITY_STYLES[item.severity]
    : SEVERITY_STYLES.suggestion;

  return (
    <Card className="border-l-2 border-l-muted-foreground/20">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
