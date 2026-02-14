import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  isSubmitting: boolean;
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  totalQuestions,
  answeredCount,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit your answers?</AlertDialogTitle>
          <AlertDialogDescription>
            {unanswered > 0 ? (
              <>
                You have answered {answeredCount} of {totalQuestions} questions.{" "}
                <span className="font-medium text-destructive">
                  {unanswered} question{unanswered > 1 ? "s" : ""} unanswered.
                </span>{" "}
                You cannot change your answers after submitting.
              </>
            ) : (
              <>
                You have answered all {totalQuestions} questions. You cannot change
                your answers after submitting.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
