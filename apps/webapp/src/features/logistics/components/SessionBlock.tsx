import type { ClassSession } from "@workspace/types";
import { format } from "date-fns";
import { cn } from "@workspace/ui/lib/utils";

interface SessionBlockProps {
  session: ClassSession;
  onClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

export function SessionBlock({
  session,
  onClick,
  isDragging,
  className,
}: SessionBlockProps) {
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);

  // Get course color from nested class->course relation
  const courseColor = session.class?.course?.color ?? "#2563EB";
  const courseName = session.class?.course?.name ?? "Course";
  const className_ = session.class?.name ?? "Class";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "cursor-pointer rounded-md px-2 py-1 text-xs transition-all",
        "border-l-4 shadow-sm hover:shadow-md",
        isDragging && "opacity-50 shadow-lg",
        className
      )}
      style={{
        backgroundColor: `${courseColor}15`,
        borderLeftColor: courseColor,
      }}
    >
      <div className="font-medium truncate" style={{ color: courseColor }}>
        {courseName}
      </div>
      <div className="text-muted-foreground truncate text-[10px]">
        {className_}
      </div>
      <div className="text-muted-foreground text-[10px]">
        {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
      </div>
      {session.roomName && (
        <div className="text-muted-foreground truncate text-[10px]">
          {session.roomName}
        </div>
      )}
    </div>
  );
}
