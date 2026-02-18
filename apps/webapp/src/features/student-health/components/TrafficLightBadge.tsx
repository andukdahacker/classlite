import type { HealthStatus } from "@workspace/types";

const STATUS_CONFIG: Record<
  HealthStatus,
  { dotColor: string; textColor: string; label: string }
> = {
  "at-risk": {
    dotColor: "bg-red-500",
    textColor: "text-red-700",
    label: "At Risk",
  },
  warning: {
    dotColor: "bg-amber-500",
    textColor: "text-amber-700",
    label: "Warning",
  },
  "on-track": {
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    label: "On Track",
  },
};

interface TrafficLightBadgeProps {
  status: HealthStatus;
  size?: "sm" | "md";
}

export function TrafficLightBadge({
  status,
  size = "sm",
}: TrafficLightBadgeProps) {
  const config = STATUS_CONFIG[status];
  const dotSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`Student status: ${config.label.toLowerCase()}`}
    >
      <span className={`${dotSize} rounded-full ${config.dotColor}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </span>
    </span>
  );
}
