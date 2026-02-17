import { useEffect } from "react";

interface UseGradingShortcutsOptions {
  onApproveItem?: (itemId: string) => void;
  onRejectItem?: (itemId: string) => void;
  onFinalize?: () => void;
  onNextSubmission?: () => void;
  onPrevSubmission?: () => void;
  highlightedItemId?: string | null;
  enabled?: boolean;
}

function isTextInput(): boolean {
  const tag = (document.activeElement?.tagName ?? "").toLowerCase();
  return (
    tag === "textarea" ||
    tag === "input" ||
    document.activeElement?.getAttribute("contenteditable") === "true"
  );
}

function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

function getTargetCardId(highlightedItemId: string | null | undefined): string | null {
  if (highlightedItemId) return highlightedItemId;
  // Stale highlight fallback — check if a card has focus
  return document.activeElement?.getAttribute("data-card-id") ?? null;
}

export function useGradingShortcuts({
  onApproveItem,
  onRejectItem,
  onFinalize,
  onNextSubmission,
  onPrevSubmission,
  highlightedItemId,
  enabled = true,
}: UseGradingShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (isTextInput() || isDialogOpen()) return;

      // Ctrl/Meta + Enter → Finalize
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onFinalize?.();
        return;
      }

      // A → Approve highlighted item
      if (e.key === "a" || e.key === "A") {
        const cardId = getTargetCardId(highlightedItemId);
        if (cardId && onApproveItem) {
          e.preventDefault();
          onApproveItem(cardId);
        }
        return;
      }

      // R → Reject highlighted item
      if (e.key === "r" || e.key === "R") {
        const cardId = getTargetCardId(highlightedItemId);
        if (cardId && onRejectItem) {
          e.preventDefault();
          onRejectItem(cardId);
        }
        return;
      }

      // ArrowLeft → Previous submission
      if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onPrevSubmission?.();
        return;
      }

      // ArrowRight → Next submission
      if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNextSubmission?.();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    highlightedItemId,
    onApproveItem,
    onRejectItem,
    onFinalize,
    onNextSubmission,
    onPrevSubmission,
  ]);
}
