import { cn } from "@workspace/ui/lib/utils";
import { useRef, useEffect } from "react";

interface QuestionNumberPillsProps {
  totalQuestions: number;
  currentIndex: number;
  answeredSet: Set<string>;
  questionIds: string[];
  onJump: (index: number) => void;
}

export function QuestionNumberPills({
  totalQuestions,
  currentIndex,
  answeredSet,
  questionIds,
  onJump,
}: QuestionNumberPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none"
    >
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isActive = i === currentIndex;
        const isAnswered = answeredSet.has(questionIds[i]);
        return (
          <button
            key={i}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onJump(i)}
            className={cn(
              "shrink-0 size-8 rounded-full text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : isAnswered
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
