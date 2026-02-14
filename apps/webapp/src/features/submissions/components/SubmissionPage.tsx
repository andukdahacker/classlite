import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { IeltsQuestionType } from "@workspace/types";

import { useStartSubmission } from "../hooks/use-start-submission";
import { useSaveAnswers } from "../hooks/use-save-answers";
import { useSubmitSubmission } from "../hooks/use-submit-submission";
import { useAssignmentDetail } from "../hooks/use-assignment-detail";
import { useUploadPhoto } from "../hooks/use-upload-photo";
import { useAutoSave } from "../hooks/use-auto-save";
import { loadAnswersLocal, clearAnswersLocal } from "../lib/submission-storage";

import { SubmissionHeader } from "./SubmissionHeader";
import { QuestionNumberPills } from "./QuestionNumberPills";
import { QuestionStepper } from "./QuestionStepper";
import { SubmitConfirmDialog } from "./SubmitConfirmDialog";
import { SubmissionCompletePage } from "./SubmissionCompletePage";
import { QuestionInputFactory } from "./question-inputs/QuestionInputFactory";
import { PassagePanel } from "./PassagePanel";
import { AudioPlayerPanel } from "./AudioPlayerPanel";

interface FlatQuestion {
  id: string;
  sectionType: IeltsQuestionType;
  questionText: string;
  options: unknown;
  wordLimit: number | null;
  sectionInstructions: string | null;
  speakingPrepTime?: number | null;
  speakingTime?: number | null;
}

export function SubmissionPage() {
  const { centerId, assignmentId } = useParams();
  const navigate = useNavigate();

  // Data fetching
  const { data: assignmentData, isLoading: isLoadingAssignment, isError } = useAssignmentDetail(assignmentId);
  const startSubmission = useStartSubmission();
  const saveAnswers = useSaveAnswers();
  const submitSubmission = useSubmitSubmission();
  const uploadPhoto = useUploadPhoto();

  // State
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevIndexRef = useRef(currentIndex);
  const elapsedRef = useRef(0);
  const pendingPhotos = useRef<Map<string, File>>(new Map());

  // Auto-save hook
  const { saveStatus, lastServerSaveTimestamp } = useAutoSave({
    centerId,
    assignmentId,
    submissionId,
    answers,
    enabled: !!submissionId && !isSubmitted,
  });

  // Restore answers from IndexedDB after server answers are seeded
  useEffect(() => {
    if (!centerId || !assignmentId || !submissionId) return;
    loadAnswersLocal(centerId, assignmentId)
      .then((stored) => {
        if (stored?.answers && Object.keys(stored.answers).length > 0) {
          setAnswers((prev) => ({ ...prev, ...stored.answers }));
        }
      })
      .catch(() => {
        // IndexedDB unavailable — server answers already seeded
      });
  }, [centerId, assignmentId, submissionId]);

  // Flatten questions from sections
  const flatQuestions = useMemo<FlatQuestion[]>(() => {
    const assignment = assignmentData?.data as Record<string, unknown> | null;
    if (!assignment) return [];

    const exercise = assignment.exercise as Record<string, unknown> | undefined;
    if (!exercise) return [];

    const sections = exercise.sections as Array<Record<string, unknown>> | undefined;
    if (!sections) return [];

    const result: FlatQuestion[] = [];
    for (const section of sections) {
      const sectionType = section.sectionType as IeltsQuestionType;
      const sectionInstructions = (section.instructions as string) || null;
      const speakingPrepTime = section.speakingPrepTime as number | null | undefined;
      const speakingTime = section.speakingTime as number | null | undefined;
      const questions = section.questions as Array<Record<string, unknown>> | undefined;
      if (!questions) continue;

      for (const q of questions) {
        result.push({
          id: q.id as string,
          sectionType,
          questionText: q.questionText as string,
          options: q.options,
          wordLimit: (q.wordLimit as number) ?? null,
          sectionInstructions,
          speakingPrepTime,
          speakingTime,
        });
      }
    }
    return result;
  }, [assignmentData]);

  const questionIds = useMemo(() => flatQuestions.map((q) => q.id), [flatQuestions]);

  const answeredSet = useMemo(() => {
    const set = new Set<string>();
    for (const [qId, val] of Object.entries(answers)) {
      if (val && typeof val === "object" && Object.keys(val as Record<string, unknown>).length > 0) {
        set.add(qId);
      }
    }
    return set;
  }, [answers]);

  // Track elapsed time
  useEffect(() => {
    const interval = window.setInterval(() => {
      elapsedRef.current += 1;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start submission on mount
  useEffect(() => {
    if (!assignmentId || submissionId) return;
    startSubmission.mutate(assignmentId, {
      onSuccess: (data) => {
        const sub = (data as { data: { id: string; startedAt: string; answers?: Array<{ questionId: string; answer: unknown }> } }).data;
        setSubmissionId(sub.id);
        setStartedAt(sub.startedAt);
        if (sub.answers?.length) {
          setAnswers((prev) => {
            const seeded = { ...prev };
            for (const a of sub.answers!) {
              if (a.answer && !seeded[a.questionId]) {
                seeded[a.questionId] = a.answer;
              }
            }
            return seeded;
          });
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to start submission");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  // useBeforeUnload guard
  useEffect(() => {
    if (isSubmitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isSubmitted]);

  // Save-on-navigate: save previous question's answer when index changes
  useEffect(() => {
    if (prevIndexRef.current === currentIndex) return;
    const prevQuestion = flatQuestions[prevIndexRef.current];
    if (prevQuestion && submissionId && answers[prevQuestion.id]) {
      // Skip if auto-save just sent a server save
      if (Date.now() - lastServerSaveTimestamp.current < 1000) {
        prevIndexRef.current = currentIndex;
        return;
      }
      saveAnswers.mutate({
        submissionId,
        answers: [{ questionId: prevQuestion.id, answer: answers[prevQuestion.id] }],
      });
    }
    prevIndexRef.current = currentIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const updateAnswer = useCallback((questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handlePhotoCapture = useCallback(
    (questionId: string, file: File) => {
      pendingPhotos.current.set(questionId, file);
    },
    [],
  );

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(flatQuestions.length - 1, prev + 1));
  }, [flatQuestions.length]);

  const handleJump = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!submissionId) return;
    setIsSubmitting(true);

    try {
      // Save all current answers first
      const allAnswers = Object.entries(answers)
        .filter(([, val]) => val && typeof val === "object" && Object.keys(val as Record<string, unknown>).length > 0)
        .map(([questionId, answer]) => ({ questionId, answer }));

      if (allAnswers.length > 0) {
        await saveAnswers.mutateAsync({ submissionId, answers: allAnswers });
      }

      // Upload pending photos
      for (const [questionId, file] of pendingPhotos.current.entries()) {
        await uploadPhoto.mutateAsync({ submissionId, questionId, file });
      }
      pendingPhotos.current.clear();

      // Submit
      await submitSubmission.mutateAsync({
        submissionId,
        timeSpentSec: elapsedRef.current,
      });

      // Clean up IndexedDB after successful submit
      if (centerId && assignmentId) {
        await clearAnswersLocal(centerId, assignmentId);
      }

      setIsSubmitted(true);
      setShowConfirm(false);
    } catch (err) {
      toast.error((err as Error).message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [submissionId, answers, saveAnswers, uploadPhoto, submitSubmission, assignmentId, centerId]);

  // Loading states
  if (isLoadingAssignment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !assignmentData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground mt-1">Could not load the assignment.</p>
          <button
            onClick={() => navigate(`/${centerId}/dashboard`)}
            className="mt-4 text-primary underline text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return <SubmissionCompletePage />;
  }

  const assignment = assignmentData.data as Record<string, unknown>;
  const exercise = assignment?.exercise as Record<string, unknown> | undefined;
  const exerciseTitle = (exercise?.title as string) ?? "Assignment";
  const timeLimit = (exercise?.timeLimit as number) ?? null;
  const autoSubmitOnExpiry = (exercise?.autoSubmitOnExpiry as boolean) ?? true;
  const passageContent = (exercise?.passageContent as string) ?? null;
  const exerciseSkill = (exercise?.skill as string) ?? "";
  const audioUrl = (exercise?.audioUrl as string) ?? null;
  const isReading = exerciseSkill === "READING";
  const isListening = exerciseSkill === "LISTENING";

  const currentQuestion = flatQuestions[currentIndex];
  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">No questions found in this assignment.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SubmissionHeader
        title={exerciseTitle}
        currentQuestion={currentIndex}
        totalQuestions={flatQuestions.length}
        timeLimit={timeLimit}
        startedAt={startedAt ?? undefined}
        autoSubmitOnExpiry={autoSubmitOnExpiry}
        onTimerExpired={handleSubmit}
        saveStatus={saveStatus}
      />

      {isListening && audioUrl && <AudioPlayerPanel audioUrl={audioUrl} />}

      <div className="px-4 pt-2">
        <QuestionNumberPills
          totalQuestions={flatQuestions.length}
          currentIndex={currentIndex}
          answeredSet={answeredSet}
          questionIds={questionIds}
          onJump={handleJump}
        />
      </div>

      {currentQuestion.sectionInstructions && (
        <div className="px-4 pt-3">
          <p className="text-xs text-muted-foreground italic">
            {currentQuestion.sectionInstructions}
          </p>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {isReading && passageContent && (
          <div className="max-w-3xl mx-auto mb-4">
            <PassagePanel passageContent={passageContent} />
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          <QuestionInputFactory
            key={currentQuestion.id}
            sectionType={currentQuestion.sectionType}
            question={{
              id: currentQuestion.id,
              questionText: currentQuestion.questionText,
              questionType: currentQuestion.sectionType,
              options: currentQuestion.options,
              wordLimit: currentQuestion.wordLimit,
            }}
            questionIndex={currentIndex}
            value={answers[currentQuestion.id] ?? null}
            onChange={(answer) => updateAnswer(currentQuestion.id, answer)}
            onPhotoCapture={(file) => handlePhotoCapture(currentQuestion.id, file)}
            speakingPrepTime={currentQuestion.speakingPrepTime}
            speakingTime={currentQuestion.speakingTime}
          />
        </div>
      </main>

      <QuestionStepper
        currentIndex={currentIndex}
        totalQuestions={flatQuestions.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={() => setShowConfirm(true)}
      />

      <SubmitConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleSubmit}
        totalQuestions={flatQuestions.length}
        answeredCount={answeredSet.size}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
