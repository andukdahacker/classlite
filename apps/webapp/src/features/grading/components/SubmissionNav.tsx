import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";

interface SubmissionNavProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function SubmissionNav({
  currentIndex,
  total,
  onPrev,
  onNext,
}: SubmissionNavProps) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < total - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && hasPrev) {
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        onNext();
      }
    },
    [hasPrev, hasNext, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrev}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Prev
      </Button>
      <span className="text-sm text-muted-foreground">
        {total > 0 ? `${currentIndex + 1} of ${total} submissions` : "No submissions"}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
