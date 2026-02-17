import { useCallback, useEffect, useId, useRef, useState } from "react";

type Severity = "error" | "warning" | "suggestion";

const STROKE_COLORS: Record<Severity, string> = {
  error: "#EF4444",
  warning: "#F59E0B",
  suggestion: "#2563EB",
};

interface LineCoords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface ConnectionLineOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  highlightedItemId: string | null;
  isMobile: boolean;
  severity?: Severity | null;
}

export function ConnectionLineOverlay({
  containerRef,
  highlightedItemId,
  isMobile,
  severity,
}: ConnectionLineOverlayProps) {
  const [coords, setCoords] = useState<LineCoords | null>(null);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef<number>(0);
  const textObserverRef = useRef<IntersectionObserver | null>(null);
  const cardObserverRef = useRef<IntersectionObserver | null>(null);
  const textVisibleRef = useRef(true);
  const cardVisibleRef = useRef(true);

  const recalculate = useCallback(() => {
    if (!containerRef.current || !highlightedItemId || isMobile) {
      setCoords(null);
      return;
    }

    const textSpan = containerRef.current.querySelector<HTMLElement>(
      `[data-feedback-id="${highlightedItemId}"]`,
    );
    const feedbackCard = containerRef.current.querySelector<HTMLElement>(
      `[data-card-id="${highlightedItemId}"]`,
    );

    if (!textSpan || !feedbackCard) {
      setCoords(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const spanRect = textSpan.getBoundingClientRect();
    const cardRect = feedbackCard.getBoundingClientRect();

    setCoords({
      startX: spanRect.right - containerRect.left,
      startY: spanRect.top + spanRect.height / 2 - containerRect.top,
      endX: cardRect.left - containerRect.left,
      endY: cardRect.top + cardRect.height / 2 - containerRect.top,
    });
  }, [containerRef, highlightedItemId, isMobile]);

  const scheduleRecalculate = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(recalculate);
  }, [recalculate]);

  // Set up IntersectionObservers for visibility tracking
  useEffect(() => {
    if (!containerRef.current || !highlightedItemId || isMobile) {
      setCoords(null);
      return;
    }

    const textSpan = containerRef.current.querySelector<HTMLElement>(
      `[data-feedback-id="${highlightedItemId}"]`,
    );
    const feedbackCard = containerRef.current.querySelector<HTMLElement>(
      `[data-card-id="${highlightedItemId}"]`,
    );

    // Clean up previous observers
    textObserverRef.current?.disconnect();
    cardObserverRef.current?.disconnect();
    textVisibleRef.current = true;
    cardVisibleRef.current = true;

    if (textSpan) {
      textObserverRef.current = new IntersectionObserver(
        ([entry]) => {
          textVisibleRef.current = entry.isIntersecting;
          setVisible(textVisibleRef.current && cardVisibleRef.current);
        },
        { threshold: 0 },
      );
      textObserverRef.current.observe(textSpan);
    }

    if (feedbackCard) {
      cardObserverRef.current = new IntersectionObserver(
        ([entry]) => {
          cardVisibleRef.current = entry.isIntersecting;
          setVisible(textVisibleRef.current && cardVisibleRef.current);
        },
        { threshold: 0 },
      );
      cardObserverRef.current.observe(feedbackCard);
    }

    // Initial calculation
    recalculate();

    return () => {
      textObserverRef.current?.disconnect();
      cardObserverRef.current?.disconnect();
    };
  }, [containerRef, highlightedItemId, isMobile, recalculate]);

  // Scroll listeners on both pane viewports
  useEffect(() => {
    if (!containerRef.current || !highlightedItemId || isMobile) return;

    const viewports = containerRef.current.querySelectorAll<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    for (const viewport of viewports) {
      viewport.addEventListener("scroll", scheduleRecalculate, {
        passive: true,
      });
    }

    return () => {
      for (const viewport of viewports) {
        viewport.removeEventListener("scroll", scheduleRecalculate);
      }
    };
  }, [containerRef, highlightedItemId, isMobile, scheduleRecalculate]);

  // ResizeObserver on container
  useEffect(() => {
    if (!containerRef.current || !highlightedItemId || isMobile) return;

    const observer = new ResizeObserver(scheduleRecalculate);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef, highlightedItemId, isMobile, scheduleRecalculate]);

  // Window resize listener
  useEffect(() => {
    if (!highlightedItemId || isMobile) return;

    window.addEventListener("resize", scheduleRecalculate);
    return () => window.removeEventListener("resize", scheduleRecalculate);
  }, [highlightedItemId, isMobile, scheduleRecalculate]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const glowFilterId = useId();

  if (isMobile || !highlightedItemId || !coords) return null;

  const strokeColor = STROKE_COLORS[(severity ?? "suggestion") as Severity];
  const cpOffset = Math.abs(coords.endX - coords.startX) * 0.4;
  const pathD = `M ${coords.startX} ${coords.startY} C ${coords.startX + cpOffset} ${coords.startY}, ${coords.endX - cpOffset} ${coords.endY}, ${coords.endX} ${coords.endY}`;

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
      style={{
        opacity: visible ? 1 : 0,
        transition: visible
          ? "opacity 200ms ease-in"
          : "opacity 150ms ease-out",
      }}
    >
      <defs>
        <filter id={glowFilterId}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {/* Glow background stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeOpacity="0.15"
        filter={`url(#${glowFilterId})`}
      />
      {/* Main dashed stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="6 3"
      />
    </svg>
  );
}
