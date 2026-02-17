import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  CircleCheck,
  Loader2,
  Mic,
  PenLine,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AIFeedbackPane } from "./components/AIFeedbackPane";
import { ConnectionLineOverlay } from "./components/ConnectionLineOverlay";
import { StudentWorkPane } from "./components/StudentWorkPane";
import { SubmissionNav } from "./components/SubmissionNav";
import { WorkbenchLayout } from "./components/WorkbenchLayout";
import { validateAnchor } from "./hooks/use-anchor-validation";
import type { AnchorStatus } from "./hooks/use-anchor-validation";
import {
  HighlightProvider,
  useHighlightState,
} from "./hooks/use-highlight-context";
import { useGradingQueue } from "./hooks/use-grading-queue";
import { useMediaQuery } from "./hooks/use-media-query";
import { usePrefetchSubmission } from "./hooks/use-prefetch-submission";
import { useRetriggerAnalysis } from "./hooks/use-retrigger-analysis";
import { useSubmissionDetail } from "./hooks/use-submission-detail";

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ANSWER_SEPARATOR = "\n\n";

function GradingQueuePageInner() {
  const { centerId, submissionId: urlSubmissionId } = useParams<{
    centerId: string;
    submissionId?: string;
  }>();
  const navigate = useNavigate();
  const workbenchRef = useRef<HTMLDivElement>(null);
  const { highlightedItemId, setHighlightedItemId } = useHighlightState();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const {
    data: queueData,
    isPending: isQueueLoading,
    error: queueError,
    refetch: refetchQueue,
  } = useGradingQueue({ limit: 50 });

  const queueItems = useMemo(
    () => queueData?.data?.items ?? [],
    [queueData?.data?.items],
  );
  const submissionIds = useMemo(
    () => queueItems.map((item) => item.submissionId),
    [queueItems],
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Sync currentIndex when queue data loads or URL submissionId changes
  useEffect(() => {
    if (submissionIds.length === 0) return;
    if (urlSubmissionId) {
      const idx = submissionIds.indexOf(urlSubmissionId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        return;
      }
    }
    // Auto-select first "ready" submission, or first item
    const readyIdx = queueItems.findIndex(
      (item) => item.analysisStatus === "ready",
    );
    setCurrentIndex(readyIdx >= 0 ? readyIdx : 0);
  }, [submissionIds, urlSubmissionId, queueItems]);

  const activeSubmissionId =
    urlSubmissionId ?? submissionIds[currentIndex] ?? null;

  const nextId =
    currentIndex < submissionIds.length - 1
      ? submissionIds[currentIndex + 1]
      : null;

  // Fetch detail for active submission
  const {
    data: detailData,
    isPending: isDetailLoading,
    error: detailError,
  } = useSubmissionDetail(activeSubmissionId);

  // Pre-fetch next submission
  usePrefetchSubmission(nextId);

  // Re-trigger analysis mutation
  const retriggerMutation = useRetriggerAnalysis(activeSubmissionId ?? "");

  // Navigation handlers
  const navigateTo = useCallback(
    (idx: number) => {
      setCurrentIndex(idx);
      const id = submissionIds[idx];
      if (id) {
        navigate(`/${centerId}/dashboard/grading/${id}`, { replace: true });
      }
    },
    [submissionIds, centerId, navigate],
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) navigateTo(currentIndex - 1);
  }, [currentIndex, navigateTo]);

  const handleNext = useCallback(() => {
    if (currentIndex < submissionIds.length - 1) navigateTo(currentIndex + 1);
  }, [currentIndex, submissionIds.length, navigateTo]);

  // Build detail content
  const detail = detailData?.data;
  const submission = detail?.submission;
  const analysisStatus = detail?.analysisStatus ?? "not_applicable";
  const feedback = detail?.feedback;
  const currentQueueItem = queueItems[currentIndex];

  const studentName = currentQueueItem?.studentName ?? "Unknown Student";
  const assignmentTitle =
    currentQueueItem?.assignmentTitle ?? "Untitled Assignment";
  const exerciseSkill = currentQueueItem?.exerciseSkill ?? "WRITING";
  const skill = (exerciseSkill === "SPEAKING" ? "SPEAKING" : "WRITING") as
    "WRITING" | "SPEAKING";
  const submittedAt =
    submission?.submittedAt ?? currentQueueItem?.submittedAt;

  const answers = useMemo(
    () =>
      (submission?.answers ?? []).map((a) => ({
        id: a.id,
        questionId: a.questionId ?? "",
        answer: (a.answer ?? {}) as { text?: string; transcript?: string },
        score: a.score ?? undefined,
      })),
    [submission?.answers],
  );

  // Build concatenated student text for anchor validation
  const concatenatedStudentText = useMemo(() => {
    return answers
      .map((a) =>
        skill === "WRITING" ? a.answer?.text ?? "" : a.answer?.transcript ?? "",
      )
      .join(ANSWER_SEPARATOR);
  }, [answers, skill]);

  // Feedback items from API
  const feedbackItems = useMemo(
    () => feedback?.items ?? [],
    [feedback?.items],
  );

  // Compute anchor statuses per feedback item
  const anchorStatuses = useMemo(() => {
    const map = new Map<string, AnchorStatus>();
    for (const item of feedbackItems) {
      const result = validateAnchor(
        item.startOffset,
        item.endOffset,
        item.originalContextSnippet,
        concatenatedStudentText,
      );
      map.set(item.id, result.anchorStatus);
    }
    return map;
  }, [feedbackItems, concatenatedStudentText]);

  // Stable highlight callback — debounce param passed through from card
  const handleHighlight = useCallback(
    (id: string | null, debounce = true) => {
      setHighlightedItemId(id, debounce);
    },
    [setHighlightedItemId],
  );

  // Get severity of currently highlighted item for the connection line
  const highlightedSeverity = useMemo(() => {
    if (!highlightedItemId) return null;
    const item = feedbackItems.find((i) => i.id === highlightedItemId);
    return (item?.severity as "error" | "warning" | "suggestion") ?? null;
  }, [highlightedItemId, feedbackItems]);

  // Loading state
  if (isQueueLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (queueError) {
    const is403 =
      queueError &&
      typeof queueError === "object" &&
      "statusCode" in queueError &&
      (queueError as { statusCode: number }).statusCode === 403;

    if (is403) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="font-medium">No Classes Assigned</p>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any classes assigned. Contact your center admin.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="font-medium text-destructive">
          Failed to load grading queue
        </p>
        <Button variant="outline" size="sm" onClick={() => refetchQueue()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty queue
  if (queueItems.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <CircleCheck className="h-10 w-10 text-green-500" />
        <h2 className="text-lg font-semibold">All caught up!</h2>
        <p className="text-sm text-muted-foreground">
          No submissions to review right now.
        </p>
      </div>
    );
  }

  // All analyzing
  const allAnalyzing = queueItems.every(
    (item) => item.analysisStatus === "analyzing",
  );
  if (allAnalyzing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium">AI is analyzing submissions...</p>
        <p className="text-sm text-muted-foreground">
          {queueItems.length} submissions analyzing
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Workbench header */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <span className="font-medium">{studentName}</span>
        <span className="text-sm text-muted-foreground">{assignmentTitle}</span>
        <Badge variant="outline">
          {skill === "WRITING" ? (
            <PenLine className="mr-1 h-3 w-3" />
          ) : (
            <Mic className="mr-1 h-3 w-3" />
          )}
          {skill === "WRITING" ? "Writing" : "Speaking"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(submittedAt ?? null)}
        </span>
      </div>

      {/* Navigation */}
      <SubmissionNav
        currentIndex={currentIndex}
        total={submissionIds.length}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Detail loading */}
      {isDetailLoading && !detail ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : detailError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-destructive">
            Failed to load submission details
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(currentIndex)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : (
        <WorkbenchLayout
          containerRef={workbenchRef}
          overlay={
            <ConnectionLineOverlay
              containerRef={workbenchRef}
              highlightedItemId={highlightedItemId}
              isMobile={isMobile}
              severity={highlightedSeverity}
            />
          }
          leftPane={
            <StudentWorkPane
              exerciseTitle={assignmentTitle}
              exerciseSkill={skill}
              sections={[]}
              answers={answers}
              feedbackItems={feedbackItems}
              anchorStatuses={anchorStatuses}
            />
          }
          rightPane={
            <AIFeedbackPane
              analysisStatus={analysisStatus}
              feedback={
                feedback
                  ? {
                      id: feedback.id,
                      overallScore: feedback.overallScore ?? null,
                      criteriaScores: feedback.criteriaScores ?? null,
                      generalFeedback: feedback.generalFeedback ?? null,
                      items: feedback.items ?? [],
                    }
                  : null
              }
              failureReason={currentQueueItem?.failureReason}
              skill={skill}
              onRetrigger={() => retriggerMutation.mutate()}
              isRetriggering={retriggerMutation.isPending}
              anchorStatuses={anchorStatuses}
              highlightedItemId={highlightedItemId}
              onHighlight={handleHighlight}
            />
          }
        />
      )}
    </div>
  );
}

export function GradingQueuePage() {
  return (
    <HighlightProvider>
      <GradingQueuePageInner />
    </HighlightProvider>
  );
}
