# Story 5.3: Evidence Anchoring

Status: done

## Story

As a Teacher,
I want to see exactly where the AI found an error in the student's text,
so that I can verify the feedback accuracy by seeing the visual connection between the comment and the evidence.

## Acceptance Criteria

1. **AC1: Visual tether line** — Hovering over (or focusing via keyboard) an AI feedback card in the right pane draws a visual "tether" line (SVG bezier curve) from the feedback card to the relevant highlighted text segment in the left pane. The highlighted text uses a background color matching the feedback severity (red for errors, amber for warnings, blue for suggestions). Only ONE active tether line renders at a time (performance constraint). The line and highlight fade in/out smoothly.
2. **AC2: Anchor retention on minor edits** — If the teacher edits < 20% of the surrounding text (compared to `originalContextSnippet`), the anchor remains attached and the highlight continues to function correctly.
3. **AC3: Orphaned anchor handling** — If > 50% of the text at the anchor position has changed, the anchor is marked as "orphaned." Orphaned feedback items display a muted "Anchor Lost" indicator instead of drawing a tether line. The feedback card remains functional but with reduced visual prominence for the anchor connection.

## Tasks / Subtasks

- [x] **Task 0: Update FeedbackItem interfaces to include offset fields** (AC: 1, 2, 3)
  - [x] 0.1 In `apps/webapp/src/features/grading/components/AIFeedbackPane.tsx`, update the `FeedbackItem` interface (lines 16-24) to add: `startOffset?: number | null`, `endOffset?: number | null`. The `originalContextSnippet` field is already present
  - [x] 0.2 In `apps/webapp/src/features/grading/components/FeedbackItemCard.tsx`, update the `FeedbackItem` interface (lines 19-27) to add: `startOffset?: number | null`, `endOffset?: number | null`. These fields are already present in the API response data but not declared in the TypeScript interfaces
  - [x] 0.3 In `apps/webapp/src/features/grading/GradingQueuePage.tsx`, verify that `feedback.items` passthrough (line 275) includes offset fields. Currently `items: feedback.items ?? []` passes all fields from the API — no changes needed here, but confirm the types flow through correctly after 0.1 and 0.2

- [x] **Task 1: Create anchor validation hook** (AC: 2, 3)
  - [x] 1.1 Create `apps/webapp/src/features/grading/hooks/use-anchor-validation.ts` — hook that takes a feedback item's `startOffset`, `endOffset`, `originalContextSnippet`, and the current student text. Returns `{ anchorStatus: 'valid' | 'drifted' | 'orphaned' | 'no-anchor', textAtOffset: string | null }`. Logic: (a) if `startOffset` or `endOffset` is null/undefined, return `no-anchor`; (b) if `originalContextSnippet` is null but offsets are valid, return `valid` (trust offsets, drift detection unavailable); (c) extract `currentText = studentText.slice(startOffset, endOffset)`; (d) compare `currentText` to `originalContextSnippet` using Levenshtein distance ratio; (e) if similarity >= 80% -> `valid`; (f) if similarity >= 50% -> `drifted` (still attached but warning); (g) if similarity < 50% -> `orphaned`
  - [x] 1.2 Implement `calculateSimilarity(a: string, b: string): number` as a pure utility function in the same file. Use **Levenshtein distance ratio**: `1 - (levenshteinDistance(a, b) / Math.max(a.length, b.length))`. Implement Levenshtein using a single-row DP approach (O(n*m) time, O(min(n,m)) space). Normalize both strings (trim, lowercase) before comparison. Do NOT import a library — for snippet lengths (typically < 200 chars) this is fast enough
  - [x] 1.3 The hook should compute the result **lazily** — only validate the anchor for the currently highlighted feedback item, not all items on mount. Export a standalone `validateAnchor(startOffset, endOffset, originalContextSnippet, studentText)` pure function for use by the parent component. Memoize per-item results with a simple Map cache keyed on `${itemId}-${studentText.length}` (invalidates if text changes)

- [x] **Task 2: Create highlight context for cross-pane communication** (AC: 1)
  - [x] 2.1 Create `apps/webapp/src/features/grading/hooks/use-highlight-context.tsx` — a React Context + Provider that manages the currently highlighted feedback item ID. Exports: `HighlightProvider`, `useHighlightState()` returning `{ highlightedItemId: string | null, setHighlightedItemId: (id: string | null) => void }`. Split the context into two: `HighlightValueContext` (the ID, changes on hover) and `HighlightSetterContext` (the setter function, stable reference). This prevents components that only need the setter from re-rendering when the value changes
  - [x] 2.2 Wrap the `WorkbenchLayout` usage in `GradingQueuePage.tsx` with `<HighlightProvider>` so both panes share the state
  - [x] 2.3 The `setHighlightedItemId` setter should include a **50ms debounce** for mouse events to prevent rapid-fire DOM queries when the user sweeps the mouse across multiple cards. Focus events should NOT be debounced (immediate response for keyboard users)

- [x] **Task 3: Fix StudentWorkPane text rendering and add highlighting** (AC: 1, 2, 3)
  - [x] 3.1 **CRITICAL PREREQUISITE:** The current `StudentWorkPane` renders student text inside `sections.map() -> questions.map()`. But `GradingQueuePage` passes `sections={[]}` (line 261), so **no student text renders at all**. Before adding highlighting, restructure text rendering to work from the `answers` array directly. Change the rendering logic: if `sections` is empty (which it is for grading), iterate over `answers` directly and render each answer's text/transcript in sequence with `Separator` dividers between multiple answers. This ensures text always renders regardless of sections
  - [x] 3.2 Add new prop `feedbackItems` to `StudentWorkPaneProps`: `feedbackItems?: Array<{ id: string; startOffset?: number | null; endOffset?: number | null; originalContextSnippet?: string | null; severity?: 'error' | 'warning' | 'suggestion' | null }>`
  - [x] 3.3 **Multi-answer offset mapping:** When `feedbackItems` is provided and there are multiple answers, reconstruct the concatenated text that the backend sent to Gemini by joining all answer texts with `"\n\n"`. For each answer, compute its `globalStartOffset` (cumulative length of previous answers + separators). When rendering each answer's `HighlightedText`, filter feedback items whose offsets fall within that answer's range and adjust offsets: `localStart = item.startOffset - globalStartOffset`, `localEnd = item.endOffset - globalStartOffset`. Skip items whose offsets span across answer boundaries (rare edge case — show as `no-anchor`)
  - [x] 3.4 Replace the plain text rendering with a new `HighlightedText` component (see Task 3.5). Pass each answer's text and its filtered/adjusted feedback items to `HighlightedText`
  - [x] 3.5 Create `apps/webapp/src/features/grading/components/HighlightedText.tsx`. This component takes `text: string` and `feedbackItems` (with local offsets), then builds a list of text segments: plain text between highlights, and highlighted spans for each item's `[startOffset, endOffset]` range. **Paragraph handling:** track cumulative character position as you iterate through `text.split("\n")`. For each paragraph, determine which segments fall within it (adjusting for consumed newline characters). A highlight that spans a `\n` boundary becomes two separate `<span>` elements across two `<p>` elements. Each highlighted span has `data-feedback-id` and `id="anchor-{itemId}"` attributes
  - [x] 3.6 When `highlightedItemId` (from context) matches a feedback item's ID, apply active highlight styling: `bg-red-100 dark:bg-red-900/30` for errors, `bg-amber-100 dark:bg-amber-900/30` for warnings, `bg-blue-100 dark:bg-blue-900/30` for suggestions. Non-active anchored spans show a subtle underline: `underline decoration-dotted decoration-muted-foreground/40`
  - [x] 3.7 When a feedback item is highlighted (active), auto-scroll the student work pane to bring the highlighted text into view using `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
  - [x] 3.8 Handle overlapping ranges: if two feedback items share character ranges, use the higher-severity item's color for the overlap (severity priority: error > warning > suggestion). Build segments by sorting all start/end boundaries and splitting into non-overlapping intervals
  - [x] 3.9 Skip highlight rendering for items where anchor validation returns `orphaned` or `no-anchor` — no highlight spans for these items

- [x] **Task 4: Modify FeedbackItemCard to support hover/focus interactions** (AC: 1, 3)
  - [x] 4.1 Add new props to `FeedbackItemCardProps`: `anchorStatus?: 'valid' | 'drifted' | 'orphaned' | 'no-anchor'`, `isHighlighted?: boolean`, `onHighlight?: (id: string | null) => void`. The `onHighlight` callback is called with the item's ID on mouse enter / focus, and `null` on mouse leave / blur
  - [x] 4.2 Add `onMouseEnter` -> `onHighlight(item.id)`, `onMouseLeave` -> `onHighlight(null)` to the Card element. Add `onFocus` -> `onHighlight(item.id)`, `onBlur` -> `onHighlight(null)` for keyboard support. Add `tabIndex={0}` for keyboard focusability. Do NOT add `role="button"` — cards are read-only informational items in this story, not actionable buttons. For mobile touch: add `onTouchStart` handler that toggles highlight (tap on = highlight, tap off = clear) and calls `event.preventDefault()` to suppress synthetic mouse events that would double-fire
  - [x] 4.3 Add `aria-details` attribute pointing to the highlighted text span ID (format: `anchor-${item.id}`) for screen reader association. Add `aria-label` with a descriptive label: e.g., `"Grammar error: Subject-verb agreement, confidence 95%, anchored to text"` or `"Grammar error: Subject-verb agreement, confidence 95%, anchor lost"` based on anchor status
  - [x] 4.4 When `isHighlighted === true`, apply a severity-specific visual ring: `ring-2 ring-red-500` for errors, `ring-2 ring-amber-500` for warnings, `ring-2 ring-primary` for suggestions. Use full opacity for WCAG high-contrast compliance (NFR11). Add `data-card-id={item.id}` attribute for DOM queries by the connection line overlay
  - [x] 4.5 When `anchorStatus === 'orphaned'`, show a small inline indicator below the content: muted text `"Anchor lost — text changed since analysis"` with `Unlink` icon from lucide-react. Dim the card with `opacity-75`. Do NOT fire onHighlight on hover/focus for orphaned items (no tether line to draw)
  - [x] 4.6 When `anchorStatus === 'drifted'`, show subtle amber dot indicator next to the type icon: `<span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Text has changed slightly since analysis" />`
  - [x] 4.7 When `anchorStatus === 'no-anchor'` (feedback items without offsets like `general` or `score_suggestion`), do NOT show any anchor indicator and do NOT fire onHighlight on hover/focus. These cards have no highlight behavior
  - [x] 4.8 **DO NOT** render any approve/reject buttons, checkboxes, or `isApproved` toggle UI. The `isApproved` field exists in the API data but is exclusively handled by Story 5.4. Cards are READ-ONLY in this story
  - [x] 4.9 Wrap the exported `FeedbackItemCard` component in `React.memo` to prevent unnecessary re-renders when the highlight context value changes. The `onHighlight` callback passed from the parent must be a stable reference (via `useCallback`) for memo to be effective

- [x] **Task 5: Create ConnectionLineOverlay (SVG tether line)** (AC: 1)
  - [x] 5.1 Create `apps/webapp/src/features/grading/components/ConnectionLineOverlay.tsx`. SVG element absolutely positioned over the `WorkbenchLayout` container with `pointer-events: none` (essential — without this the overlay blocks all interactions with the panels below). Props: `containerRef: RefObject<HTMLDivElement>`, `highlightedItemId: string | null`, `isMobile: boolean`
  - [x] 5.2 When `highlightedItemId` is set and NOT mobile: query the DOM for `[data-feedback-id="${highlightedItemId}"]` (text highlight span) and `[data-card-id="${highlightedItemId}"]` (feedback card). Use `getBoundingClientRect()` on both elements, then **subtract the container's own `getBoundingClientRect()`** to get container-relative coordinates: `relativeX = elementRect.left - containerRect.left`, `relativeY = elementRect.top - containerRect.top`. Draw an SVG `<path>` with a cubic bezier: start at the right edge center of the text span, end at the left edge center of the card
  - [x] 5.3 Style the line **dynamically by severity**: pass the active item's severity to determine stroke color — `#EF4444` (red-500) for errors, `#F59E0B` (amber-500) for warnings, `#2563EB` (primary) for suggestions. Use `strokeWidth="2"`, `strokeDasharray="6 3"` for a dashed look, `fill="none"`. Add a subtle glow using an SVG filter: `<filter><feGaussianBlur stdDeviation="2" /></filter>` on a thicker background stroke
  - [x] 5.4 Animate the line in/out using CSS transitions: `opacity` transition over 200ms on appear, 150ms on disappear. Prefer CSS over framer-motion for this — it's a simple opacity toggle
  - [x] 5.5 Recalculate line position on: (a) **scroll events** from either pane — attach scroll listeners to both `ScrollArea` viewports (query via `[data-slot="scroll-area-viewport"]` inside the container), use `requestAnimationFrame` for smooth repositioning, detach on unmount; (b) **panel resize** — attach a `ResizeObserver` to the container ref to detect when the user drags the resize handle between panes; (c) **window resize** — listen for window resize events. All recalculations use rAF throttling
  - [x] 5.6 If either the text span or the card is scrolled out of view (not visible within its pane), hide the line entirely. Use `IntersectionObserver` on both elements to track visibility — when either becomes non-intersecting with its scroll container, set line opacity to 0
  - [x] 5.7 Add `aria-hidden="true"` to the SVG element — the visual line is decorative and invisible to screen readers

- [x] **Task 6: Integrate overlay into WorkbenchLayout** (AC: 1)
  - [x] 6.1 Modify `WorkbenchLayout` to accept new optional props: `overlay?: React.ReactNode`, `containerRef?: React.RefObject<HTMLDivElement>`. Wrap the existing `ResizablePanelGroup` in a `<div ref={containerRef} className="relative min-h-0 flex-1">` container. Render the overlay as `<div className="absolute inset-0 pointer-events-none z-10">{overlay}</div>` on top of the panels
  - [x] 6.2 Extract `useMediaQuery` from `WorkbenchLayout.tsx` into a shared utility `apps/webapp/src/features/grading/hooks/use-media-query.ts` so both `WorkbenchLayout` and `GradingQueuePage` can use it. Import it back into `WorkbenchLayout`
  - [x] 6.3 In `GradingQueuePage.tsx`: create `workbenchRef = useRef<HTMLDivElement>(null)`, read `{ highlightedItemId, setHighlightedItemId }` from `useHighlightState()`, get `isMobile` from `useMediaQuery("(max-width: 767px)")`. Pass `<ConnectionLineOverlay containerRef={workbenchRef} highlightedItemId={highlightedItemId} isMobile={isMobile} />` as the `overlay` prop and `workbenchRef` as `containerRef`
  - [x] 6.4 Wire up the feedback items in `GradingQueuePage.tsx`: compute `anchorStatus` per item using the `validateAnchor` pure function (from Task 1). Build the concatenated student text from answers for validation. Pass `onHighlight={setHighlightedItemId}` (wrapped in `useCallback`), `anchorStatus`, and `isHighlighted={highlightedItemId === item.id}` through to `AIFeedbackPane`, which passes them down to each `FeedbackItemCard`
  - [x] 6.5 Wire up student work pane: pass `feedbackItems` prop to `StudentWorkPane` with the offset data from the feedback items array

- [x] **Task 7: Mobile fallback — color highlighting only** (AC: 1)
  - [x] 7.1 On mobile viewports (< 768px), `ConnectionLineOverlay` renders nothing (`isMobile` prop). No SVG lines are drawn
  - [x] 7.2 On mobile, text highlighting still works (background color on spans). Tapping a feedback card in the stacked layout highlights the corresponding text and auto-scrolls to it
  - [x] 7.3 Touch events handled in Task 4.2 (`onTouchStart` with `preventDefault()` to suppress synthetic mouse events)

- [x] **Task 8: Write tests** (AC: 1, 2, 3)
  - [x] 8.1 Unit test `use-anchor-validation.ts` — test all anchor statuses: valid (exact match), valid (80%+ similarity), drifted (50-80%), orphaned (<50%), no-anchor (null offsets), valid with null originalContextSnippet (offsets present but no snippet). Test `calculateSimilarity` with edge cases: empty strings, identical strings, completely different strings, partial overlap, single character difference (10 tests)
  - [x] 8.2 Unit test `use-highlight-context.tsx` — test context provides/consumes state correctly, setting highlightedItemId updates value consumers, setter context does not re-render setter-only consumers (5 tests)
  - [x] 8.3 Component test `HighlightedText` — verify: highlighted span renders with correct `data-feedback-id`, correct severity background color applied to active item, dotted underline on inactive anchored spans, orphaned items have no span, overlapping ranges render correctly with severity priority, cross-paragraph highlights split into separate spans, multi-answer offset adjustment works (10 tests)
  - [x] 8.4 Component test `StudentWorkPane` with highlighting — verify: text renders when sections is empty (from answers directly), highlighted text auto-scrolls on highlight change, word count still displays correctly, multi-answer separator renders (6 tests)
  - [x] 8.5 Component test `FeedbackItemCard` interactions — verify: mouse enter sets highlighted, mouse leave clears highlighted, focus sets highlighted, blur clears highlighted, orphaned status shows "Anchor lost" text and does NOT fire onHighlight, drifted shows amber dot, no-anchor items have no hover behavior, aria-details attribute correct, React.memo prevents re-render when isHighlighted unchanged (10 tests)
  - [x] 8.6 Component test `ConnectionLineOverlay` — verify: SVG renders when highlightedItemId is set and not mobile, SVG hidden when mobile, SVG hidden when no matching DOM elements, aria-hidden present, pointer-events-none on overlay, stroke color matches severity (7 tests)
  - [x] 8.7 Integration test: verify end-to-end hover flow — hovering a feedback card highlights the text, draws a line with correct severity color, and clearing hover removes both (3 tests)

## Dev Notes

### Architecture Compliance

**This is a FRONTEND-ONLY story.** No backend changes needed. All data (`startOffset`, `endOffset`, `originalContextSnippet`) is already populated by Story 5.1's AI analysis and returned in the existing API response. Story 5.2 already renders the feedback items — this story adds the visual connection layer.

**Student text is READ-ONLY in this story.** The left pane displays the student's submission as non-editable text. There is no teacher editing of student text. The UX spec mentions a future "Range Adapter" layer for when text becomes editable (ProseMirror) — that is NOT part of this story. The anchor validation hook only detects drift between original AI analysis and current text, which in practice means it will almost always return `valid` since the text doesn't change between analysis and grading. The drift/orphan logic is forward-compatible for when text editing is introduced.

**Key architectural pattern: cross-pane state via React Context.** The two panes (StudentWorkPane and AIFeedbackPane) need to communicate which feedback item is hovered. Since they're siblings rendered inside `WorkbenchLayout`, use a shared React Context rather than lifting state through 3 levels of props. Split context into value + setter to minimize re-render cascade.

### CRITICAL: StudentWorkPane Text Rendering Fix Required

The current `StudentWorkPane` renders student text inside `sections.map() -> questions.map()`. But `GradingQueuePage` passes `sections={[]}` (line 261), so **no student text renders at all** — the text rendering code is dead code in the current grading context.

**Task 3.1 must restructure this FIRST:** When `sections` is empty, render directly from the `answers` array. Each answer's `text` (for Writing) or `transcript` (for Speaking) renders in sequence. This is a prerequisite for all highlighting work.

### Multi-Answer Offset Mapping Algorithm

The backend concatenates all student answers with `"\n\n"` before sending to Gemini (`analyze-submission.job.ts` line 144). AI offsets are **global** (relative to this concatenated text). The frontend renders answers individually.

**Offset mapping for multi-answer submissions:**
```
Answer 1 text: "The quick brown fox..." (length 200)
Separator: "\n\n" (length 2)
Answer 2 text: "Another paragraph..." (length 150)

Concatenated: "The quick brown fox...\n\nAnother paragraph..."
              |---- answer 1: [0, 200) ----|  |---- answer 2: [202, 352) ----|

For Answer 1: filter items where startOffset < 200
  localOffset = globalOffset (no adjustment)

For Answer 2: filter items where startOffset >= 202 && endOffset <= 352
  localStart = globalStart - 202
  localEnd = globalEnd - 202

Items spanning the "\n\n" boundary: skip (mark as no-anchor)
```

For single-answer submissions (majority of Writing/Speaking exercises), no adjustment is needed — the single answer text IS the full text.

### Existing Components to MODIFY (DO NOT RECREATE)

| Component | File | Changes |
|-----------|------|---------|
| `StudentWorkPane` | `src/features/grading/components/StudentWorkPane.tsx` | Fix text rendering for empty sections, add `feedbackItems` prop, use `HighlightedText` |
| `FeedbackItemCard` | `src/features/grading/components/FeedbackItemCard.tsx` | Add offset fields to interface, add hover/focus handlers, anchor indicators, aria, wrap in React.memo |
| `AIFeedbackPane` | `src/features/grading/components/AIFeedbackPane.tsx` | Add offset fields to interface, pass anchor status + highlight callbacks to each FeedbackItemCard |
| `WorkbenchLayout` | `src/features/grading/components/WorkbenchLayout.tsx` | Add `overlay` + `containerRef` props, wrap in relative container, extract useMediaQuery |
| `GradingQueuePage` | `src/features/grading/GradingQueuePage.tsx` | Wrap with HighlightProvider, compute anchor statuses, pass feedbackItems + overlay |

### New Components to CREATE

| Component | File | Purpose |
|-----------|------|---------|
| `HighlightedText` | `src/features/grading/components/HighlightedText.tsx` | Renders student text with highlighted spans for feedback anchors |
| `ConnectionLineOverlay` | `src/features/grading/components/ConnectionLineOverlay.tsx` | SVG bezier curve tether line between panes |

### New Hooks/Utils to CREATE

| Hook | File | Purpose |
|------|------|---------|
| `useAnchorValidation` / `validateAnchor` | `hooks/use-anchor-validation.ts` | Validates if text at offsets matches original snippet |
| `HighlightProvider` / `useHighlightState` | `hooks/use-highlight-context.tsx` | Shared state for which feedback item is highlighted |
| `useMediaQuery` | `hooks/use-media-query.ts` | Extracted from WorkbenchLayout for shared use |

### Data Available from API (Already Exists — DO NOT CREATE)

Each feedback item from `GET /api/v1/grading/submissions/:id` already includes:

```typescript
{
  id: string;
  type: "grammar" | "vocabulary" | "coherence" | "score_suggestion" | "general";
  content: string;
  startOffset: number | null;    // Character position in student text where issue starts (0-indexed)
  endOffset: number | null;      // Character position where issue ends (exclusive)
  originalContextSnippet: string | null;  // Text at those offsets at time of AI analysis
  suggestedFix: string | null;
  severity: "error" | "warning" | "suggestion" | null;
  confidence: number | null;     // 0-1 float
  isApproved: boolean | null;    // null = pending — DO NOT render UI for this field (Story 5.4)
}
```

**Offset details:**
- Offsets are **character positions** in the student's answer text (0-indexed, endOffset is exclusive)
- Calculated by Gemini AI during Story 5.1's `analyze-submission.job.ts`
- `originalContextSnippet` = the text substring at those offsets at analysis time (used for drift detection). Can be `null` even when offsets are present — in that case, trust the offsets (no drift detection possible)
- Items of type `general` and `score_suggestion` typically have `null` offsets (no specific text anchor)
- For multi-answer submissions, offsets are relative to concatenated text (see "Multi-Answer Offset Mapping Algorithm" above)
- **UTF-16 caveat:** JavaScript `.slice()` operates on UTF-16 code units. Gemini may count by Unicode code points. For standard English IELTS text this is identical. For emoji or supplementary plane characters, offsets could drift — the anchor validation's similarity check serves as a safety net for this case

### SVG Tether Line Geometry

The ConnectionLineOverlay draws a single bezier curve:
```
Text span (left pane)  ────────>  Feedback card (right pane)

Start point: right edge center of highlighted text span
End point: left edge center of feedback card
Control points: S-curve with horizontal offset = 40% of distance
```

**Container-relative coordinate calculation:**
```typescript
const containerRect = containerRef.current.getBoundingClientRect();
const spanRect = textSpan.getBoundingClientRect();
const cardRect = feedbackCard.getBoundingClientRect();

// Convert viewport-relative to container-relative
const startX = spanRect.right - containerRect.left;
const startY = spanRect.top + spanRect.height / 2 - containerRect.top;
const endX = cardRect.left - containerRect.left;
const endY = cardRect.top + cardRect.height / 2 - containerRect.top;

const cpOffset = Math.abs(endX - startX) * 0.4;
// SVG path: M startX startY C (startX+cpOffset) startY, (endX-cpOffset) endY, endX endY
```

### Severity Color Mapping

| Severity | Active Highlight BG | Line Stroke | Card Ring (active) |
|----------|-------------------|------------|-----------|
| error | `bg-red-100 dark:bg-red-900/30` | `#EF4444` (red-500) | `ring-2 ring-red-500` |
| warning | `bg-amber-100 dark:bg-amber-900/30` | `#F59E0B` (amber-500) | `ring-2 ring-amber-500` |
| suggestion | `bg-blue-100 dark:bg-blue-900/30` | `#2563EB` (primary) | `ring-2 ring-primary` |
| (inactive anchor) | none — `underline decoration-dotted` | n/a | n/a |

### Keyboard Accessibility Requirements

- Feedback cards must be focusable via Tab (`tabIndex={0}`). For lists with many items, implement **roving tabindex**: only one card in the group has `tabIndex={0}` (the focused one), the rest have `tabIndex={-1}`. Use `ArrowDown`/`ArrowUp` to move focus within the card list. This prevents Tab-overload with 50+ cards
- When a card receives focus, the corresponding text highlights and the tether line draws (same as hover)
- `aria-details="anchor-{itemId}"` on the card links to the highlighted span's `id="anchor-{itemId}"`
- The SVG line is `aria-hidden="true"` (purely decorative)
- Screen reader should read: type + content + severity + confidence (existing) + anchor status (new)
- Focus ring uses full-opacity severity color for WCAG high-contrast compliance (NFR11)

### Performance Constraints

- **Only ONE tether line** renders at a time. Never render all lines simultaneously (50+ items = scroll jank)
- **Lazy anchor validation:** Only compute similarity for the currently highlighted item, not all items eagerly on mount. Cache results per item in a Map
- **Debounced hover:** `setHighlightedItemId` from mouse events uses 50ms debounce to prevent rapid-fire DOM queries when sweeping across cards. Focus events (keyboard) are immediate
- **React.memo on FeedbackItemCard:** Prevents 50+ cards from re-rendering on every hover. The `onHighlight` callback must be a stable `useCallback` reference for memo to work
- **Split context:** Value and setter in separate contexts so setter-only consumers (FeedbackItemCard) don't re-render when the value changes
- Scroll/resize listeners use `requestAnimationFrame` for throttling
- Line position recalculation should be < 1ms (just `getBoundingClientRect()` calls)
- Use `IntersectionObserver` for visibility checks
- `useMemo` all computed values (segment lists, offset mappings)

### Responsive Breakpoints

| Viewport | Behavior |
|----------|----------|
| Desktop (> 1024px) | Full tether lines + text highlighting + hover interactions |
| Tablet (768-1024px) | Full tether lines + text highlighting + hover interactions |
| Mobile (< 768px) | Text highlighting ONLY — no SVG lines (stacked layout, lines would occlude) |

### Scope Boundaries — What This Story Does NOT Implement

| Feature | Story | Status |
|---------|-------|--------|
| Accept/reject AI suggestions (`isApproved` UI) | 5.4 | Backlog |
| Teacher score override | 5.4 | Backlog |
| "Approve & Next" action | 5.4 | Backlog |
| Teacher editing of student text | Not planned | — |
| Range Adapter for offset shifting on edit | Not planned | — |
| Click-to-edit text at anchor | Not planned | — |
| Drag anchors to new positions | Not planned | — |

**Feedback cards remain READ-ONLY in this story.** The only new interaction is hover/focus to show the visual connection. No approve/reject buttons. No editing capabilities. No `isApproved` UI treatment.

### Existing Dependencies (NO NEW PACKAGES NEEDED)

| Package | Usage in This Story |
|---------|---------------------|
| `framer-motion` | Not needed — use CSS transitions for line fade |
| `lucide-react` | `Unlink` icon for orphaned indicator |
| `tailwindcss` | All highlight and ring styling |
| `react` | Context, refs, memo, useCallback |

### Previous Story Intelligence (from 5-2)

**Patterns established in Story 5.2:**
- `FeedbackItemCard` receives items with `originalContextSnippet` — already displays it as `<del>original</del> -> <ins>fix</ins>` for suggested fixes
- `WorkbenchLayout` uses `ResizablePanelGroup` with `autoSaveId` — the overlay must work correctly when panel sizes change (handled by ResizeObserver in Task 5.5)
- `useMediaQuery` hook exists in `WorkbenchLayout.tsx` as a local non-exported function — extract to shared hook in Task 6.2
- The `sections` prop on `StudentWorkPane` is passed as empty `[]` from `GradingQueuePage` (line 261) — **this means no text renders at all** (see "CRITICAL: StudentWorkPane Text Rendering Fix Required" section above). Task 3.1 fixes this
- The `feedback.items` array is passed through from the API response (line 275 of GradingQueuePage). The items contain `startOffset`, `endOffset`, and `originalContextSnippet` in the runtime data, but the current TypeScript `FeedbackItem` interfaces in both `AIFeedbackPane.tsx` (line 16-24) and `FeedbackItemCard.tsx` (line 19-27) do NOT declare these fields. Task 0 adds them

**Code review findings from 5-2 that apply:**
- Use stable `useMemo` references for derived data to prevent unnecessary re-renders
- All hook state should be properly cleaned up on unmount (scroll listeners, intersection observers, ResizeObservers)
- Test mocks should be wrapped in `act()` for state updates

### Project Structure Notes

All new files go in the existing `apps/webapp/src/features/grading/` directory. Test files use the existing `__tests__/` subdirectory pattern established by Story 5.2 (6 test files already live there):

```
apps/webapp/src/features/grading/
├── GradingQueuePage.tsx               # MODIFIED — add HighlightProvider, compute anchors, wire overlay
├── components/
│   ├── AIFeedbackPane.tsx             # MODIFIED — add offset fields to interface, pass callbacks
│   ├── FeedbackItemCard.tsx           # MODIFIED — add offset fields, hover/focus, anchor indicators, React.memo
│   ├── StudentWorkPane.tsx            # MODIFIED — fix empty-sections rendering, add feedbackItems prop
│   ├── WorkbenchLayout.tsx            # MODIFIED — add overlay + containerRef props, extract useMediaQuery
│   ├── HighlightedText.tsx            # NEW — text rendering with highlight spans
│   └── ConnectionLineOverlay.tsx      # NEW — SVG tether line overlay
├── hooks/
│   ├── use-anchor-validation.ts       # NEW — validates text offset anchors
│   ├── use-highlight-context.tsx      # NEW — shared highlight state context (split value/setter)
│   └── use-media-query.ts            # NEW — extracted from WorkbenchLayout for shared use
└── __tests__/
    ├── use-anchor-validation.test.ts  # NEW — 10 tests
    ├── use-highlight-context.test.tsx  # NEW — 5 tests
    ├── HighlightedText.test.tsx        # NEW — 10 tests
    ├── StudentWorkPane.test.tsx        # EXISTING — add 6 tests for highlighting + empty-sections fix
    ├── FeedbackItemCard.test.tsx       # NEW — 10 tests
    ├── ConnectionLineOverlay.test.tsx  # NEW — 7 tests
    └── evidence-anchoring.test.tsx     # NEW — 3 integration tests

**No modified backend files.**
**No new dependencies to install.**
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 — Story 5.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Section 6.2 ConnectionLine, Section 2.4 Evidence Anchoring, Section 8 Responsive]
- [Source: _bmad-output/planning-artifacts/architecture.md — Feature-first structure, state management patterns]
- [Source: _bmad-output/implementation-artifacts/5-2-split-screen-grading-interface.md — Component architecture, hook patterns, data structures]
- [Source: _bmad-output/implementation-artifacts/5-1-automated-submission-analysis.md — AI offset generation, data model]
- [Source: project-context.md — Testing rules, import patterns, no any types]
- [Source: packages/types/src/grading.ts — AIFeedbackItemSchema with startOffset/endOffset/originalContextSnippet]
- [Source: packages/db/prisma/schema.prisma — AIFeedbackItem model]
- [Source: apps/backend/src/modules/grading/jobs/analyze-submission.job.ts — How offsets are generated, answer concatenation]
- [Source: apps/webapp/src/features/grading/components/FeedbackItemCard.tsx — Current card component to modify]
- [Source: apps/webapp/src/features/grading/components/StudentWorkPane.tsx — Current text rendering to fix and modify]
- [Source: apps/webapp/src/features/grading/components/WorkbenchLayout.tsx — Layout to add overlay]
- [Source: apps/webapp/src/features/grading/GradingQueuePage.tsx — Entry point wiring, sections=[] at line 261]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debug sessions needed.

### Completion Notes List

- **Task 0:** Added `startOffset` and `endOffset` to `FeedbackItem` interfaces in `AIFeedbackPane.tsx` and `FeedbackItemCard.tsx`. Verified types flow through `GradingQueuePage.tsx` passthrough.
- **Task 1:** Created `use-anchor-validation.ts` with Levenshtein-based similarity calculation, `validateAnchor` pure function, and memoization cache. Single-row DP approach for O(min(n,m)) space.
- **Task 2:** Created `use-highlight-context.tsx` with split value/setter contexts (prevents re-render cascade), 50ms debounced mouse events, immediate focus events. Extracted `useMediaQuery` to shared `use-media-query.ts`.
- **Task 3:** Fixed critical StudentWorkPane bug — renders text from `answers` directly when `sections=[]`. Created `HighlightedText` component with paragraph splitting, severity-aware highlighting, overlapping range handling via boundary-based segment building.
- **Task 4:** Modified `FeedbackItemCard` with hover/focus/touch handlers, orphaned/drifted indicators, aria-label/aria-details for accessibility, severity-specific ring styling, wrapped in React.memo.
- **Task 5:** Created `ConnectionLineOverlay` with SVG bezier curves, scroll/resize/IntersectionObserver listeners, severity-based stroke colors, glow filter, CSS opacity transitions.
- **Task 6:** Wired everything in `GradingQueuePage` with `HighlightProvider`, overlay, anchor status computation, and prop threading through `AIFeedbackPane`.
- **Task 7:** Mobile fallback built into ConnectionLineOverlay (returns null when isMobile). Touch events from Task 4.2 handle mobile interactions.
- **Task 8:** 51 new tests across 7 test files — all 732 tests pass with 0 failures.

### Change Log

- 2026-02-16: Story 5.3 Evidence Anchoring implemented — visual tether lines, anchor validation, cross-pane highlighting
- 2026-02-17: Code review — 10 issues found (3H, 5M, 2L), all fixed. Fixes: aria-details anchor id always present, keyboard focus no longer debounced, touchstart no longer blocks scroll, O(n²)→O(n) segment positions, debounce timer cleanup on unmount, deduplicated anchor validation, removed dead cache code, unique SVG filter id, stable segment keys, deterministic test assertion

### File List

**Modified:**
- `apps/webapp/src/features/grading/components/AIFeedbackPane.tsx` — Added offset fields to interface, anchor/highlight props, passes callbacks to FeedbackItemCard
- `apps/webapp/src/features/grading/components/FeedbackItemCard.tsx` — Added offset fields, hover/focus/touch handlers, orphaned/drifted indicators, aria attrs, React.memo
- `apps/webapp/src/features/grading/components/StudentWorkPane.tsx` — Fixed empty-sections rendering from answers, added feedbackItems prop, multi-answer offset mapping
- `apps/webapp/src/features/grading/components/WorkbenchLayout.tsx` — Added overlay/containerRef props, extracted useMediaQuery to shared hook, wrapped in relative container
- `apps/webapp/src/features/grading/GradingQueuePage.tsx` — Added HighlightProvider, ConnectionLineOverlay, anchor status computation, feedbackItems wiring
- `apps/webapp/src/features/grading/__tests__/StudentWorkPane.test.tsx` — Added 6 tests for empty-sections + highlighting
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story 5-3 status updated

**New:**
- `apps/webapp/src/features/grading/hooks/use-anchor-validation.ts` — validateAnchor, calculateSimilarity, memoization cache
- `apps/webapp/src/features/grading/hooks/use-highlight-context.tsx` — Split value/setter contexts, HighlightProvider, debounced setter
- `apps/webapp/src/features/grading/hooks/use-media-query.ts` — Extracted shared useMediaQuery hook
- `apps/webapp/src/features/grading/components/HighlightedText.tsx` — Text rendering with highlight spans, paragraph handling, severity colors
- `apps/webapp/src/features/grading/components/ConnectionLineOverlay.tsx` — SVG bezier tether line with scroll/resize recalculation
- `apps/webapp/src/features/grading/__tests__/use-anchor-validation.test.ts` — 20 tests
- `apps/webapp/src/features/grading/__tests__/use-highlight-context.test.tsx` — 5 tests
- `apps/webapp/src/features/grading/__tests__/HighlightedText.test.tsx` — 10 tests
- `apps/webapp/src/features/grading/__tests__/FeedbackItemCard.test.tsx` — 10 tests
- `apps/webapp/src/features/grading/__tests__/ConnectionLineOverlay.test.tsx` — 7 tests
- `apps/webapp/src/features/grading/__tests__/evidence-anchoring.test.tsx` — 3 integration tests
