import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useNavigate, useParams } from "react-router";
import { useState, useEffect, useRef } from "react";

interface SubmissionHeaderProps {
  title: string;
  skill?: string;
  currentQuestion: number;
  totalQuestions: number;
  timeLimit?: number | null;
  startedAt?: string;
  autoSubmitOnExpiry?: boolean;
  onTimerExpired?: () => void;
}

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SubmissionHeader({
  title,
  currentQuestion,
  totalQuestions,
  timeLimit,
  startedAt,
  autoSubmitOnExpiry,
  onTimerExpired,
}: SubmissionHeaderProps) {
  const navigate = useNavigate();
  const { centerId } = useParams();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    intervalRef.current = window.setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  const remaining = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
  const isLowTime = remaining !== null && remaining < 300; // < 5 min
  const expiredRef = useRef(false);

  useEffect(() => {
    if (remaining === 0 && autoSubmitOnExpiry && onTimerExpired && !expiredRef.current) {
      expiredRef.current = true;
      onTimerExpired();
    }
  }, [remaining, autoSubmitOnExpiry, onTimerExpired]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => navigate(`/${centerId}/dashboard`)}
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium truncate">{title}</h1>
          <p className="text-xs text-muted-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </p>
        </div>

        {remaining !== null && (
          <div
            className={`flex items-center gap-1 text-sm font-mono tabular-nums ${
              isLowTime ? "text-destructive font-semibold" : "text-muted-foreground"
            }`}
          >
            <Clock className="size-4" />
            {formatTimer(remaining)}
          </div>
        )}
      </div>
    </header>
  );
}
