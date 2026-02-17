import { useCallback, useEffect, useRef, useState } from "react";

interface SelectionState {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
  containerRelativePos: { x: number; y: number };
  answerIndex: number;
}

interface AnswerOffset {
  globalStartOffset: number;
}

export function useTextSelection(
  containerRef: React.RefObject<HTMLDivElement | null>,
  answerOffsets: AnswerOffset[],
) {
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const isProcessingRef = useRef(false);

  const processSelection = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const container = containerRef.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        return;
      }

      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);

      // Check both ends are within the container
      if (
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
      ) {
        return;
      }

      // Check both ends are in the same answer
      const startAnswer = (range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement
      )?.closest("[data-answer-index]");
      const endAnswer = (range.endContainer instanceof Element
        ? range.endContainer
        : range.endContainer.parentElement
      )?.closest("[data-answer-index]");

      if (!startAnswer || !endAnswer || startAnswer !== endAnswer) {
        return; // Cross-answer selection — reject
      }

      const answerIndex = parseInt(
        startAnswer.getAttribute("data-answer-index") ?? "0",
      );

      // Compute local offsets using data-char-start attributes
      const startSpan = (range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement
      )?.closest("[data-char-start]");
      const endSpan = (range.endContainer instanceof Element
        ? range.endContainer
        : range.endContainer.parentElement
      )?.closest("[data-char-start]");

      if (!startSpan || !endSpan) return;

      const segStart = parseInt(startSpan.getAttribute("data-char-start") ?? "0");
      const segEnd = parseInt(endSpan.getAttribute("data-char-start") ?? "0");

      const localStartOffset = segStart + range.startOffset;
      const localEndOffset = segEnd + range.endOffset;

      if (localEndOffset <= localStartOffset) return;

      // Compute container-relative position for popover
      const containerRect = container.getBoundingClientRect();
      const selRect = range.getBoundingClientRect();
      const pos = {
        x: selRect.left - containerRect.left,
        y: selRect.bottom - containerRect.top + container.scrollTop,
      };

      // Compute global offsets
      const globalBase = answerOffsets[answerIndex]?.globalStartOffset ?? 0;
      const globalStart = globalBase + localStartOffset;
      const globalEnd = globalBase + localEndOffset;

      setSelectionState({
        text,
        startOffset: globalStart,
        endOffset: globalEnd,
        rect: selRect,
        containerRelativePos: pos,
        answerIndex,
      });
    } finally {
      isProcessingRef.current = false;
    }
  }, [containerRef, answerOffsets]);

  const clearSelection = useCallback(() => {
    setSelectionState(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return;
      }
      // Only process if selection is within our container
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (container.contains(range.startContainer)) {
          processSelection();
        }
      }
    };

    const handleMouseUp = () => {
      // Small delay to let selection finalize
      setTimeout(handleSelectionChange, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        handleSelectionChange();
      }
    };

    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("keyup", handleKeyUp);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("keyup", handleKeyUp);
    };
  }, [containerRef, processSelection]);

  // Clear on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectionState) {
        clearSelection();
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectionState, clearSelection]);

  return { selectionState, clearSelection };
}
