import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { BandScoreCard } from "./BandScoreCard";
import { FeedbackItemCard } from "./FeedbackItemCard";

type AnalysisStatus = "not_applicable" | "analyzing" | "ready" | "failed";
type FeedbackType =
  | "grammar"
  | "vocabulary"
  | "coherence"
  | "score_suggestion"
  | "general";

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  content: string;
  suggestedFix?: string | null;
  severity?: "error" | "warning" | "suggestion" | null;
  confidence?: number | null;
  originalContextSnippet?: string | null;
}

interface CriteriaScores {
  taskAchievement?: number;
  coherence?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  fluency?: number;
  pronunciation?: number;
}

interface Feedback {
  id: string;
  overallScore: number | null;
  criteriaScores: CriteriaScores | null;
  generalFeedback: string | null;
  items: FeedbackItem[];
}

interface AIFeedbackPaneProps {
  analysisStatus: AnalysisStatus;
  feedback: Feedback | null | undefined;
  failureReason?: string | null;
  skill: "WRITING" | "SPEAKING";
  onRetrigger: () => void;
  isRetriggering: boolean;
}

const TYPE_ORDER: FeedbackType[] = [
  "grammar",
  "vocabulary",
  "coherence",
  "score_suggestion",
  "general",
];

const TYPE_LABELS: Record<FeedbackType, string> = {
  grammar: "Grammar Issues",
  vocabulary: "Vocabulary",
  coherence: "Coherence",
  score_suggestion: "Score Suggestions",
  general: "General",
};

function groupByType(items: FeedbackItem[]) {
  const groups = new Map<FeedbackType, FeedbackItem[]>();
  for (const item of items) {
    const list = groups.get(item.type) ?? [];
    list.push(item);
    groups.set(item.type, list);
  }
  return TYPE_ORDER.filter((t) => groups.has(t)).map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: groups.get(type)!,
  }));
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <p className="text-center text-sm text-muted-foreground animate-pulse">
        AI is analyzing this submission...
      </p>
    </div>
  );
}

function FailedState({
  failureReason,
  onRetrigger,
  isRetriggering,
}: {
  failureReason?: string | null;
  onRetrigger: () => void;
  isRetriggering: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">AI Analysis Failed</p>
        {failureReason && (
          <p className="text-sm text-muted-foreground">{failureReason}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetrigger}
        disabled={isRetriggering}
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${isRetriggering ? "animate-spin" : ""}`}
        />
        Re-analyze
      </Button>
      <p className="text-xs text-muted-foreground">
        You can still grade manually without AI assistance.
      </p>
    </div>
  );
}

export function AIFeedbackPane({
  analysisStatus,
  feedback,
  failureReason,
  skill,
  onRetrigger,
  isRetriggering,
}: AIFeedbackPaneProps) {
  if (analysisStatus === "analyzing") {
    return (
      <ScrollArea className="h-full">
        <LoadingSkeleton />
      </ScrollArea>
    );
  }

  if (analysisStatus === "failed") {
    return (
      <ScrollArea className="h-full">
        <FailedState
          failureReason={failureReason}
          onRetrigger={onRetrigger}
          isRetriggering={isRetriggering}
        />
      </ScrollArea>
    );
  }

  if (!feedback) {
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            AI analysis completed with no feedback items.
          </p>
        </div>
      </ScrollArea>
    );
  }

  const groups = groupByType(feedback.items);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <BandScoreCard
          overallScore={feedback.overallScore}
          criteriaScores={feedback.criteriaScores}
          skill={skill}
        />

        {feedback.generalFeedback && (
          <div className="rounded-lg border p-3">
            <h3 className="mb-1.5 text-sm font-medium">General Feedback</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feedback.generalFeedback}
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.type}>
            <h3 className="mb-2 text-sm font-medium">
              {group.label} ({group.items.length})
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <FeedbackItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
