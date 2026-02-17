import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCallback } from "react";
import type {
  CommentVisibility,
  CreateTeacherComment,
  TeacherComment,
  UpdateTeacherComment,
} from "@workspace/types";
import { BandScoreCard } from "./BandScoreCard";
import { FeedbackItemCard } from "./FeedbackItemCard";
import { TeacherCommentCard } from "./TeacherCommentCard";
import { AddCommentInput } from "./AddCommentInput";
import type { AnchorStatus } from "../hooks/use-anchor-validation";

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
  startOffset?: number | null;
  endOffset?: number | null;
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
  anchorStatuses?: Map<string, AnchorStatus>;
  highlightedItemId?: string | null;
  onHighlight?: (id: string | null, debounce?: boolean) => void;
  teacherComments?: TeacherComment[];
  currentUserId?: string;
  onCreateComment?: (data: CreateTeacherComment) => void;
  onUpdateComment?: (commentId: string, data: UpdateTeacherComment) => void;
  onDeleteComment?: (commentId: string) => void;
  isCreatingComment?: boolean;
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

function TeacherCommentsSection({
  comments,
  currentUserId,
  anchorStatuses,
  highlightedItemId,
  onHighlight,
  onUpdateComment,
  onDeleteComment,
  onCreateComment,
  isCreatingComment,
}: {
  comments: TeacherComment[];
  currentUserId?: string;
  anchorStatuses?: Map<string, AnchorStatus>;
  highlightedItemId?: string | null;
  onHighlight?: (id: string | null, debounce?: boolean) => void;
  onUpdateComment?: (commentId: string, data: UpdateTeacherComment) => void;
  onDeleteComment?: (commentId: string) => void;
  onCreateComment?: (data: CreateTeacherComment) => void;
  isCreatingComment?: boolean;
}) {
  const handleEdit = useCallback(
    (commentId: string, content: string) => {
      onUpdateComment?.(commentId, { content });
    },
    [onUpdateComment],
  );

  const handleDelete = useCallback(
    (commentId: string) => {
      onDeleteComment?.(commentId);
    },
    [onDeleteComment],
  );

  const handleVisibilityChange = useCallback(
    (commentId: string, visibility: CommentVisibility) => {
      onUpdateComment?.(commentId, { visibility });
    },
    [onUpdateComment],
  );

  const handleGeneralComment = useCallback(
    (content: string, visibility: CommentVisibility) => {
      onCreateComment?.({
        content,
        startOffset: null,
        endOffset: null,
        visibility,
      });
    },
    [onCreateComment],
  );

  return (
    <>
      {comments.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              Teacher Comments
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-2">
            {comments.map((comment) => (
              <TeacherCommentCard
                key={comment.id}
                comment={comment}
                isAuthor={comment.authorId === currentUserId}
                isHighlighted={highlightedItemId === comment.id}
                onHighlight={onHighlight}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVisibilityChange={handleVisibilityChange}
                anchorStatus={anchorStatuses?.get(comment.id)}
              />
            ))}
          </div>
        </>
      )}

      {onCreateComment && (
        <AddCommentInput
          onSubmit={handleGeneralComment}
          isSubmitting={isCreatingComment ?? false}
        />
      )}
    </>
  );
}

export function AIFeedbackPane({
  analysisStatus,
  feedback,
  failureReason,
  skill,
  onRetrigger,
  isRetriggering,
  anchorStatuses,
  highlightedItemId,
  onHighlight,
  teacherComments = [],
  currentUserId,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  isCreatingComment,
}: AIFeedbackPaneProps) {
  const teacherSection = (
    <TeacherCommentsSection
      comments={teacherComments}
      currentUserId={currentUserId}
      anchorStatuses={anchorStatuses}
      highlightedItemId={highlightedItemId}
      onHighlight={onHighlight}
      onUpdateComment={onUpdateComment}
      onDeleteComment={onDeleteComment}
      onCreateComment={onCreateComment}
      isCreatingComment={isCreatingComment}
    />
  );

  if (analysisStatus === "analyzing") {
    return (
      <ScrollArea className="h-full">
        <LoadingSkeleton />
        <div className="px-4 pb-4">{teacherSection}</div>
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
        <div className="px-4 pb-4">{teacherSection}</div>
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
        <div className="px-4 pb-4">{teacherSection}</div>
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
                <FeedbackItemCard
                  key={item.id}
                  item={item}
                  anchorStatus={anchorStatuses?.get(item.id)}
                  isHighlighted={highlightedItemId === item.id}
                  onHighlight={onHighlight}
                />
              ))}
            </div>
          </div>
        ))}

        {teacherSection}
      </div>
    </ScrollArea>
  );
}
