# Story 5.7: Free-Form Teacher Commenting

Status: done

## Story

As a Teacher,
I want to add my own comments to student work — both anchored to specific text and general — with control over visibility,
so that I can provide personalized feedback beyond what the AI generates.

## Acceptance Criteria

1. **AC1: Text-Anchored Comment Creation** — Teacher can select a text range in the student's work (left pane) and a comment input popover appears. Teacher types a free-form comment and submits it. The comment creates a visual anchor identical to AI-generated anchors (highlight + tether line from Story 5.3).
2. **AC2: General Comment Creation** — Teacher can add unanchored comments via an "Add Comment" button in the feedback pane (right pane). These appear in the feed without a text anchor.
3. **AC3: Visibility Toggle** — Each teacher comment has a visibility toggle: "Private" (visible only to the teacher, not shown to students) or "Student-Facing" (visible to both teacher and student). Default: Student-Facing.
4. **AC4: Mixed Feed Display** — Teacher comments appear in the same feed as AI feedback items, visually distinguished by a "Teacher" badge and author attribution (teacher name/avatar). Feed is ordered chronologically by creation time, with AI items grouped first.
5. **AC5: Comment Persistence** — Teacher comments are persisted to the backend immediately on creation. Comments survive page refresh and are associated with the specific submission.
6. **AC6: Edit & Delete** — Teacher can edit or delete their own comments. Edits are saved immediately. Deleted comments are permanently removed.
7. **AC7: During & After Grading** — Comments can be added both during the active grading session (before approval) and after grading is complete (teacher can revisit a graded submission to add more comments).
8. **AC8: Student View Integration** — Student-facing teacher comments appear in the Student Feedback View (Story 5.6) alongside approved AI comments, with clear "Teacher" attribution. **NOTE:** Story 5.6 is still backlog. This story ensures the backend API supports visibility filtering and the data model is ready. Frontend integration into the student feedback view will be completed when Story 5.6 is implemented.
9. **AC9: Keyboard Accessibility** — Comment creation supports keyboard workflow: Ctrl+Enter to submit, Escape to cancel. Tab order follows logical flow.

## Tasks / Subtasks

- [x] **Task 1: Database schema — Add TeacherComment model** (AC: 5, 7)
  - [x] 1.1 Add `TeacherComment` model to `packages/db/prisma/schema.prisma`. Fields: `id` (String, cuid), `centerId` (String, @map "center_id"), `submissionId` (String, @map "submission_id"), `authorId` (String, @map "author_id"), `content` (String), `startOffset` (Int?, @map "start_offset"), `endOffset` (Int?, @map "end_offset"), `originalContextSnippet` (String?, @map "original_context_snippet"), `visibility` (String, default "student_facing" — values: "private" | "student_facing"), `createdAt` (DateTime, @default now(), @map "created_at"), `updatedAt` (DateTime, @updatedAt, @map "updated_at"). Relations: `submission Submission` (fields: [submissionId], references: [id], onDelete: Cascade), `author User` (fields: [authorId], references: [id]). Indexes: `@@index([centerId])`, `@@index([submissionId])`. Table name: `@@map("teacher_comment")`. The relation is NOT unique on submissionId — multiple comments per submission allowed
  - [x] 1.2 Add reverse relation `teacherComments TeacherComment[]` to the `Submission` model (line ~715 in schema.prisma, after the existing `feedback` relation)
  - [x] 1.3 Run migration: `pnpm --filter=db db:migrate:dev --name add-teacher-comment-model`
  - [x] 1.4 Generate Prisma client: `pnpm --filter=db db:generate`
  - [x] 1.5 Build db package: `pnpm --filter=db build`

- [x] **Task 2: Shared types — TeacherComment schemas** (AC: 5)
  - [x] 2.1 In `packages/types/src/grading.ts`, add `CommentVisibilitySchema = z.enum(["private", "student_facing"])` after the existing enums (~line 44)
  - [x] 2.2 Add `TeacherCommentSchema = z.object({ id: z.string(), centerId: z.string(), submissionId: z.string(), authorId: z.string(), authorName: z.string(), authorAvatarUrl: z.string().nullable(), content: z.string(), startOffset: z.number().int().nullable(), endOffset: z.number().int().nullable(), originalContextSnippet: z.string().nullable(), visibility: CommentVisibilitySchema, createdAt: z.string(), updatedAt: z.string() })`. Note: `authorName` and `authorAvatarUrl` are joined fields, not direct DB columns — resolved from the User relation (`select: { name: true, avatarUrl: true }`) when fetching
  - [x] 2.3 Add `CreateTeacherCommentSchema = z.object({ content: z.string().min(1).max(5000), startOffset: z.number().int().nullable().optional(), endOffset: z.number().int().nullable().optional(), originalContextSnippet: z.string().nullable().optional(), visibility: CommentVisibilitySchema.default("student_facing") })`. Validation: if `startOffset` is provided, `endOffset` must also be provided (and vice versa). Add `.refine()` for this
  - [x] 2.4 Add `UpdateTeacherCommentSchema = z.object({ content: z.string().min(1).max(5000).optional(), visibility: CommentVisibilitySchema.optional() }).refine(data => data.content !== undefined || data.visibility !== undefined, { message: "At least one field must be provided" })`
  - [x] 2.5 Add `TeacherCommentResponseSchema` wrapping the comment, and `TeacherCommentListResponseSchema` as an array
  - [x] 2.6 Update `SubmissionDetailResponseSchema` (~line 194) to include `teacherComments: z.array(TeacherCommentSchema).optional()` alongside the existing `feedback` field
  - [x] 2.7 Export all new schemas and inferred types (`TeacherComment`, `CreateTeacherComment`, `UpdateTeacherComment`, `CommentVisibility`)
  - [x] 2.8 Build types package: `pnpm --filter=types build`

- [x] **Task 3: Backend service — Comment CRUD methods** (AC: 5, 6, 7)
  - [x] 3.1 In `apps/backend/src/modules/grading/grading.service.ts`, add method `createComment(centerId: string, submissionId: string, firebaseUid: string, data: CreateTeacherComment)`. Logic: (a) call `verifyAccess()` to check teacher has access to this submission; (b) resolve `authorId` from `firebaseUid` via AuthAccount lookup; (c) validate the submission exists and belongs to the center; (d) **DO NOT check submission status** — comments are allowed on submissions in ANY status (SUBMITTED, AI_PROCESSING, GRADED) per AC7; (e) if `startOffset`/`endOffset` provided, validate offsets are non-negative and `endOffset > startOffset`; (f) create `TeacherComment` record via `getTenantedClient`; (g) return the created comment with author name + avatarUrl joined (`include: { author: { select: { name: true, avatarUrl: true } } }`). Use the existing `verifyAccess` pattern from `getAnalysisResults` (line ~133)
  - [x] 3.2 Add method `getComments(centerId: string, submissionId: string, firebaseUid: string, visibility?: CommentVisibility)`. Logic: (a) `verifyAccess()`; (b) query `TeacherComment` where `submissionId` matches AND optionally filter by `visibility` if provided (for AC8 — student view will pass `"student_facing"`); (c) include `author` relation (`select: { name: true, avatarUrl: true }`); (d) order by `createdAt ASC`; (e) return array of comments with `authorName` and `authorAvatarUrl` resolved from the joined author
  - [x] 3.3 Add method `updateComment(centerId: string, submissionId: string, commentId: string, firebaseUid: string, data: UpdateTeacherComment)`. Logic: (a) `verifyAccess()`; (b) find the comment by `id` + `submissionId`; (c) verify the `authorId` matches the requesting user (teachers can only edit their own comments); (d) update the comment; (e) return updated comment with author name
  - [x] 3.4 Add method `deleteComment(centerId: string, submissionId: string, commentId: string, firebaseUid: string)`. Logic: (a) `verifyAccess()`; (b) find the comment; (c) verify `authorId` matches; (d) delete the comment. Return void
  - [x] 3.5 Modify `getAnalysisResults` method (~line 133) to also include `teacherComments` in the response. Add to the Prisma `include`: `teacherComments: { include: { author: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } }`. Map the comments to add `authorName` and `authorAvatarUrl` from the joined author. Include `teacherComments` in the returned object alongside `submission`, `analysisStatus`, `feedback`

- [x] **Task 4: Backend controller + routes** (AC: 5, 6)
  - [x] 4.1 In `grading.controller.ts`, add method `createComment(centerId, submissionId, firebaseUid, body)` — delegates to service, serializes dates, returns `{ data: comment, message: "Comment created" }`
  - [x] 4.2 Add `getComments(centerId, submissionId, firebaseUid)` — delegates to service, returns `{ data: comments, message: "Comments retrieved" }`
  - [x] 4.3 Add `updateComment(centerId, submissionId, commentId, firebaseUid, body)` — delegates to service, serializes dates, returns `{ data: comment, message: "Comment updated" }`
  - [x] 4.4 Add `deleteComment(centerId, submissionId, commentId, firebaseUid)` — delegates to service, returns `{ data: null, message: "Comment deleted" }`
  - [x] 4.5 Update `getSubmissionDetail` controller method to include `teacherComments` in the serialized response — same serialization pattern as feedback items (Date → ISO string)
  - [x] 4.6 In `grading.routes.ts`, add 4 new routes under the existing `/submissions/:submissionId` prefix:
    - `POST /submissions/:submissionId/comments` — body: `CreateTeacherCommentSchema`, response: `TeacherCommentResponseSchema`, auth: TEACHER/ADMIN/OWNER
    - `GET /submissions/:submissionId/comments` — query: optional `visibility` param (`CommentVisibilitySchema`), response: `TeacherCommentListResponseSchema`, auth: TEACHER/ADMIN/OWNER. When `visibility` is provided, filter results server-side (AC8 — student view will use `?visibility=student_facing`)
    - `PATCH /submissions/:submissionId/comments/:commentId` — body: `UpdateTeacherCommentSchema`, params: `submissionId` + `commentId`, response: `TeacherCommentResponseSchema`, auth: TEACHER/ADMIN/OWNER
    - `DELETE /submissions/:submissionId/comments/:commentId` — params: `submissionId` + `commentId`, response: `{ message }`, auth: TEACHER/ADMIN/OWNER
  - [x] 4.7 Update the existing `GET /submissions/:submissionId` route's response schema to include `teacherComments` array

- [x] **Task 5: Schema sync — Regenerate frontend types** (AC: 5)
  - [x] 5.1 Start the backend: `pnpm --filter=backend dev`
  - [x] 5.2 Generate frontend schema: `pnpm --filter=webapp sync-schema-dev`
  - [x] 5.3 Verify `apps/webapp/src/schema/schema.d.ts` now includes the teacher comment endpoints and the `teacherComments` field in the submission detail response type

- [x] **Task 6: Frontend hooks — Comment CRUD** (AC: 5, 6)
  - [x] 6.1 In `apps/webapp/src/features/grading/hooks/grading-keys.ts`, add new query key: `comments: (submissionId: string) => [...gradingKeys.all, "comments", submissionId] as const`
  - [x] 6.2 Create `apps/webapp/src/features/grading/hooks/use-teacher-comments.ts`. Export `useTeacherComments(submissionId)` — React Query hook using `gradingKeys.comments(submissionId)`, fetches `GET /api/v1/grading/submissions/{submissionId}/comments`, enabled when `submissionId` is truthy, staleTime 30s. **However:** since comments are also returned in the submission detail response (Task 3.5), prefer using the detail query data for display and use separate comment queries only as fallback. Export `getCommentsFromDetail(detailData)` helper to extract `teacherComments` from the detail response
  - [x] 6.3 Create `apps/webapp/src/features/grading/hooks/use-create-comment.ts`. Export `useCreateComment(submissionId)` — TanStack mutation calling `POST /api/v1/grading/submissions/{submissionId}/comments` via `client.POST(...)` from `@/core/client`. On success: invalidate `gradingKeys.detail(submissionId)` to refetch submission with updated comments. Show `toast.success("Comment added")` via sonner. **No optimistic update** — comment creation is a single DB insert (~100ms latency), simple invalidation is cleaner and avoids cache mutation complexity on the nested detail structure
  - [x] 6.4 Create `apps/webapp/src/features/grading/hooks/use-update-comment.ts`. Export `useUpdateComment(submissionId)` — TanStack mutation calling `client.PATCH("/api/v1/grading/submissions/{submissionId}/comments/{commentId}", ...)`. Accepts `{ commentId, data: UpdateTeacherComment }`. On success: invalidate `gradingKeys.detail(submissionId)`. On error: `toast.error("Failed to update comment")`. No optimistic update — same rationale as create
  - [x] 6.5 Create `apps/webapp/src/features/grading/hooks/use-delete-comment.ts`. Export `useDeleteComment(submissionId)` — TanStack mutation calling `client.DELETE(...)`. On success: invalidate detail query. On error: `toast.error("Failed to delete comment")`. **No confirmation dialog in the hook** — the confirmation `AlertDialog` is managed by `TeacherCommentCard` component state (hooks should not render UI)

- [x] **Task 7: TeacherCommentCard component** (AC: 3, 4, 6)
  - [x] 7.1 Create `apps/webapp/src/features/grading/components/TeacherCommentCard.tsx`. Props: `comment: TeacherComment`, `isHighlighted?: boolean`, `onHighlight?: (id: string | null, debounce?: boolean) => void`, `onEdit: (commentId: string) => void`, `onDelete: (commentId: string) => void`, `onVisibilityChange: (commentId: string, visibility: CommentVisibility) => void`, `anchorStatus?: AnchorStatus`
  - [x] 7.2 Card visual design: use shadcn `Card` (import from `@workspace/ui/components/card`) with a distinct left border color — `border-l-4 border-l-emerald-500` to visually distinguish from AI cards (which have no left border). Header: show "Teacher" badge (`Badge` from `@workspace/ui/components/badge`, `variant="secondary"` with `User` icon from lucide-react) + author avatar (`Avatar` with `authorAvatarUrl` or fallback initials) + author name + relative timestamp (`formatDistanceToNow` from `date-fns`). If anchored (startOffset not null), show the `originalContextSnippet` as a quoted block (`blockquote` style with italic text)
  - [x] 7.3 Visibility indicator: small icon next to the badge — `Eye` icon for "student_facing", `EyeOff` icon for "private". The icon is a clickable toggle button (`Button variant="ghost" size="icon"`) that cycles between the two states. Tooltip: "Visible to student" / "Private — only you can see this"
  - [x] 7.4 Content display: render `comment.content` as plain text with `whitespace-pre-wrap` (preserve line breaks). No markdown rendering — keep it simple
  - [x] 7.5 Actions: three-dot menu (`DropdownMenu` from `@workspace/ui/components/dropdown-menu`, trigger: `MoreHorizontal` icon from lucide-react, `Button variant="ghost" size="icon"`) with "Edit" (`Pencil` icon) and "Delete" (`Trash2` icon, destructive style). Only show if the current user is the author (pass `isAuthor: boolean` prop computed by parent from `comment.authorId === currentUser.id`). Delete action triggers an inline `AlertDialog` (from `@workspace/ui/components/alert-dialog`) confirmation: "Delete this comment? This cannot be undone." with Cancel/Delete buttons. Manage dialog open state locally in TeacherCommentCard
  - [x] 7.6 Highlight behavior: if `anchorStatus` is `valid` or `drifted`, support hover/focus highlighting identical to `FeedbackItemCard` (onMouseEnter → onHighlight(id), etc.). If `no-anchor` or `orphaned`, no highlight interaction. Add `data-card-id={comment.id}` for ConnectionLineOverlay DOM queries. Add `tabIndex={0}` for keyboard focus. Wrap in `React.memo`
  - [x] 7.7 Orphaned/drifted indicators: extract shared `AnchorStatusIndicator` component from the existing `FeedbackItemCard` logic (orphaned → "Anchor lost" muted text with `Unlink` icon + `opacity-75`, drifted → amber dot with tooltip). Use `AnchorStatusIndicator` in both `FeedbackItemCard` (refactor) and `TeacherCommentCard` to prevent logic duplication
  - [x] 7.8 Private comment styling: when `visibility === "private"`, apply `bg-muted/50` background and dashed border (`border-dashed`) to visually indicate it's private. Add small `"Private"` label below the badge

- [x] **Task 8: Text selection + anchored comment creation** (AC: 1, 9)
  - [x] 8.1 Create `apps/webapp/src/features/grading/components/CommentPopover.tsx`. An **absolutely-positioned div** (NOT shadcn Popover — text selections have no stable trigger element) that floats near the text selection within the StudentWorkPane scroll container. Props: `position: { x: number, y: number }` (coordinates relative to the scroll container), `onSubmit: (content: string, visibility: CommentVisibility) => void`, `onCancel: () => void`, `selectedText: string`. Style: `position: absolute; left: {x}px; top: {y}px; z-index: 20` (above ConnectionLineOverlay's z-10). UI: shadcn `Card` with `Textarea` (from `@workspace/ui/components/textarea`, autoFocus, max 5000 chars, 3 rows min), visibility toggle (default "student_facing"), "Comment" button (`Button size="sm"`) and "Cancel" button (`Button variant="ghost" size="sm"`). Show the selected text as a quoted preview above the textarea (truncated to 100 chars with ellipsis). Keyboard: Ctrl+Enter → submit, Escape → cancel. Click outside → cancel (use `useEffect` with `mousedown` listener on document)
  - [x] 8.2 Create `apps/webapp/src/features/grading/hooks/use-text-selection.ts`. Hook that manages text selection state within the student work pane. Accepts `containerRef: RefObject<HTMLDivElement>` and `answerOffsets: Array<{ globalStartOffset: number, containerElement?: HTMLElement }>`. Returns `{ selectionState: { text: string, startOffset: number, endOffset: number, rect: DOMRect, containerRelativePos: { x: number, y: number } } | null, clearSelection: () => void }`. Logic: listen for `mouseup` and `keyup` (Shift+arrow selection) events on the container ref. On selection: (a) get `window.getSelection()`; (b) validate selection is within the container and **within a single answer** — if `range.startContainer` and `range.endContainer` are in different answer containers, discard the selection (cross-answer selections produce invalid offsets); (c) compute character offsets using `data-char-start` attributes on text segment spans (see Task 8.3); (d) compute container-relative position: `const containerRect = containerRef.current.getBoundingClientRect(); const selRect = range.getBoundingClientRect(); const pos = { x: selRect.left - containerRect.left, y: selRect.bottom - containerRect.top + containerRef.current.scrollTop }` (accounts for scroll); (e) store the full state. Clear on click outside, Escape, or new selection elsewhere
  - [x] 8.3 Modify `HighlightedText.tsx`: add `data-char-start={segment.startOffset}` attribute to every text segment `<span>`. This provides DOM → character offset mapping for the selection hook. The segments already track their start positions — just expose them as data attributes
  - [x] 8.4 Modify `StudentWorkPane.tsx`: accept new prop `onCreateComment?: (data: { content: string, startOffset: number, endOffset: number, originalContextSnippet: string, visibility: CommentVisibility }) => void`. Add `data-answer-index={index}` attribute to each answer's wrapper `<div>` (for cross-answer selection detection in `useTextSelection`). Use `useTextSelection` hook on the answer text container, passing the `answerOffsets` array (already computed for AI feedback). When a selection exists, render `CommentPopover` positioned at `selectionState.containerRelativePos`. On submit: compute the **global** offset (using the same `globalStartOffset` mapping from Task 3.3 of Story 5-3 — the per-answer offset mapping already exists in StudentWorkPane). Call `onCreateComment` with global offsets + selected text as `originalContextSnippet`. Clear selection after submit
  - [x] 8.5 Multi-answer offset calculation: when teacher selects text in Answer N, the global offset = `answer[N].globalStartOffset + localOffset`. The `globalStartOffset` per answer is already computed in StudentWorkPane (lines 81-142 from Story 5-3's multi-answer offset mapping). Expose this array so the selection hook can use it

- [x] **Task 9: General comment creation** (AC: 2, 9)
  - [x] 9.1 Create `apps/webapp/src/features/grading/components/AddCommentInput.tsx`. An inline comment input that appears at the bottom of the feedback pane. Props: `onSubmit: (content: string, visibility: CommentVisibility) => void`, `isSubmitting: boolean`. UI: collapsible — shows "Add a comment..." placeholder text button. When clicked, expands to `Textarea` (autoFocus, 3 rows, max 5000 chars) + visibility toggle + "Submit" button + "Cancel" button. Keyboard: Ctrl+Enter → submit, Escape → collapse. After submit, collapse back to placeholder and clear input
  - [x] 9.2 In `AIFeedbackPane.tsx`, add `AddCommentInput` at the bottom of the feedback feed (after all AI items and teacher comments). Wire `onSubmit` to the `useCreateComment` mutation with `startOffset: null`, `endOffset: null` (general comment, no anchor)

- [x] **Task 10: Mixed feed + visibility + edit/delete integration** (AC: 3, 4, 6, 7)
  - [x] 10.1 Modify `AIFeedbackPane.tsx` to accept new props: `teacherComments?: TeacherComment[]`, `currentUserId?: string`, `onCreateComment: (data: CreateTeacherComment) => void`, `onUpdateComment: (commentId: string, data: UpdateTeacherComment) => void`, `onDeleteComment: (commentId: string) => void`. **Handle null feedback gracefully:** if `analysisStatus !== 'ready'` (loading/failed) but `teacherComments` has items, render the loading/failed state for AI feedback THEN render teacher comments section below it. Teacher comments are always visible regardless of AI analysis state (AC7)
  - [x] 10.2 Build the mixed feed: create a unified `feedItems` array that merges AI feedback items and teacher comments. Each item has a `source: 'ai' | 'teacher'` discriminator. Sort: AI items first (grouped by type as existing), then teacher comments in chronological order (`createdAt ASC`). Use `useMemo` to compute this merged array. The FeedbackItemCard and TeacherCommentCard components render their respective types
  - [x] 10.3 Add a separator between AI items and teacher comments sections: `<Separator />` with a label "Teacher Comments" (only show if there are teacher comments). Use `<div className="flex items-center gap-2 my-3"><Separator className="flex-1" /><span className="text-xs text-muted-foreground">Teacher Comments</span><Separator className="flex-1" /></div>`
  - [x] 10.4 Wire teacher comment actions: `onEdit` → enter inline editing mode on the TeacherCommentCard (replace content display with textarea, save on Ctrl+Enter or blur, cancel on Escape) → call `onUpdateComment`. `onDelete` → TeacherCommentCard manages its own `AlertDialog` confirmation state (see Task 7.5), on confirm calls `onDeleteComment(commentId)`. `onVisibilityChange` → call `onUpdateComment(commentId, { visibility: newValue })`
  - [x] 10.5 Inline editing state: manage via local state in TeacherCommentCard. When editing: textarea replaces content, "Save" + "Cancel" buttons appear, card has `ring-2 ring-primary` border. Save calls `onEdit` callback with new content

- [x] **Task 11: GradingQueuePage wiring** (AC: 1-7)
  - [x] 11.1 In `GradingQueuePage.tsx`, extract `teacherComments` from the submission detail response: `const teacherComments = detail?.data?.teacherComments ?? []`
  - [x] 11.2 Initialize comment mutation hooks: `const createComment = useCreateComment(activeSubmissionId)`, `const updateComment = useUpdateComment(activeSubmissionId)`, `const deleteComment = useDeleteComment(activeSubmissionId)`
  - [x] 11.3 Get current user's internal ID: `const { user } = useAuth()` from `@/features/auth/auth-context`. The internal user ID is `user.id` (NOT `firebaseUid`). Pass `currentUserId={user?.id}` to AIFeedbackPane so it can compute `isAuthor={comment.authorId === currentUserId}` for each TeacherCommentCard
  - [x] 11.4 Wire `onCreateComment` from StudentWorkPane (anchored comments): call `createComment.mutate({ content, startOffset, endOffset, originalContextSnippet, visibility })`
  - [x] 11.5 Pass all comment props to `AIFeedbackPane`: `teacherComments`, `currentUserId`, `onCreateComment` (for general comments via AddCommentInput), `onUpdateComment` (for edit/visibility), `onDeleteComment`
  - [x] 11.6 Compute anchor statuses for teacher comments: extend the existing anchor status computation (already done for AI items in Story 5-3, lines ~6.4) to also compute statuses for teacher comments that have offsets. Use the same `validateAnchor` function. Merge into a single `anchorStatuses` Map that covers both AI items and teacher comments (keyed by item/comment ID — IDs are cuid so no collision)
  - [x] 11.7 Pass teacher comment IDs to the highlight system: the existing `highlightedItemId` from `useHighlightState()` can be either an AI item ID or a teacher comment ID. No changes needed to the highlight context — it's just a string ID. The ConnectionLineOverlay queries DOM by `data-card-id` and `data-feedback-id`, so ensure TeacherCommentCard uses `data-card-id={comment.id}` and HighlightedText spans use `data-feedback-id={comment.id}` for teacher comment anchors (same attributes as AI items). **CRITICAL: Pass severity to ConnectionLineOverlay for teacher comments.** Currently GradingQueuePage computes the highlighted item's severity by looking up the AI feedback items. Extend this lookup: when `highlightedItemId` matches a teacher comment (check `teacherComments` array), pass `severity={null}` to the overlay (which maps to emerald stroke via Task 12.3)

- [x] **Task 12: Highlight integration for anchored teacher comments** (AC: 1)
  - [x] 12.1 Modify `StudentWorkPane.tsx`: merge teacher comments that have offsets into the `feedbackItems` array passed to `HighlightedText`. Map each anchored teacher comment to the same `StudentWorkFeedbackItem` shape: `{ id: comment.id, startOffset: comment.startOffset, endOffset: comment.endOffset, originalContextSnippet: comment.originalContextSnippet, severity: null }`. Teacher comments get `severity: null` — they'll use a distinct color (emerald) instead of the severity-based colors
  - [x] 12.2 Modify `HighlightedText.tsx`: add a new highlight color for items with `severity === null` (teacher comments): `bg-emerald-100 dark:bg-emerald-900/30` for active highlight, `underline decoration-dotted decoration-emerald-400/40` for inactive. Update the `ACTIVE_BG` map to include `null` → emerald. Update the severity priority to treat `null` as lowest priority (below suggestion) for overlapping ranges
  - [x] 12.3 Modify `ConnectionLineOverlay.tsx`: add stroke color for `null` severity (teacher comments): `#10B981` (emerald-500). The overlay already determines stroke color from the highlighted item — extend the severity-to-color mapping
  - [x] 12.4 Modify `TeacherCommentCard.tsx`: when `isHighlighted`, show `ring-2 ring-emerald-500` (distinct from AI items' severity-based rings)

- [x] **Task 13: Write tests** (AC: 1-9)
  - [x] 13.1 Backend: unit test `grading.service.ts` — test `createComment` (valid + invalid offsets + access denied), `getComments` (returns ordered by createdAt), `updateComment` (own comment + someone else's comment → error), `deleteComment` (own + others → error). Test that `getAnalysisResults` now includes `teacherComments`. (8 tests)
  - [x] 13.2 Backend: integration test `grading.routes.integration.test.ts` — test all 4 comment CRUD endpoints including auth checks, validation errors, 404 for non-existent comments. Test the updated submission detail response includes teacherComments. (10 tests)
  - [x] 13.3 Frontend: unit test `use-create-comment.ts` — test mutation calls correct endpoint, invalidates detail query on success, handles error. (3 tests)
  - [x] 13.4 Frontend: component test `TeacherCommentCard` — verify: Teacher badge renders with author name, visibility toggle works, edit mode activates, delete triggers confirmation, anchored comment highlights on hover, private styling applied, orphaned indicator shown, React.memo prevents unnecessary re-renders. (8 tests)
  - [x] 13.5 Frontend: component test `CommentPopover` — verify: textarea renders on open, Ctrl+Enter submits, Escape cancels, visibility toggle works, selected text preview shown, empty submit prevented. (6 tests)
  - [x] 13.6 Frontend: component test `AddCommentInput` — verify: expands on click, collapses on cancel/submit, Ctrl+Enter submits, visibility toggle works. (4 tests)
  - [x] 13.7 Frontend: component test `use-text-selection` — verify: selection detected on mouseup, offsets computed from data-char-start attributes, multi-answer global offset calculation, clears on click outside. (4 tests)
  - [x] 13.8 Frontend: integration test — verify: selecting text shows popover, submitting popover creates anchored comment, general comment appears in feed, teacher comments have correct highlight colors (emerald), mixed feed ordering correct. (5 tests)

## Dev Notes

### Architecture Compliance

**This is a FULL-STACK story.** Requires database migration, backend API endpoints, shared type definitions, and frontend UI components.

**Layered architecture pattern (Route → Controller → Service):**
- **Service:** Handles DB operations via `getTenantedClient(prisma, centerId)`. Contains access control logic.
- **Controller:** Orchestrates service calls, serializes dates, formats standard `{ data, message }` response.
- **Route:** Handles Fastify request/reply, extracts params/body, calls controller, maps errors to HTTP status codes.

**Multi-tenancy:** All `TeacherComment` queries must go through `getTenantedClient`. The `centerId` column ensures tenant isolation.

### CRITICAL: Design Decision — Separate Model vs Extending AIFeedbackItem

**Decision: Use a separate `TeacherComment` model.** Rationale:
- `AIFeedbackItem` has AI-specific fields (`confidence`, `suggestedFix`, `isApproved`, `teacherOverrideText`) irrelevant to teacher comments
- Teacher comments have `visibility` and `authorId` fields irrelevant to AI items
- Clean separation prevents data pollution and simplifies queries
- The frontend merges them into a single feed for display — the UI abstraction handles the "mixed feed" requirement

### Data Flow for Comment Creation (Anchored)

```
1. Teacher selects text in StudentWorkPane
2. Browser selection → useTextSelection hook computes character offsets
   - Uses data-char-start attributes on HighlightedText segments
   - Adjusts for multi-answer global offsets (same mapping as Story 5-3)
3. CommentPopover appears near selection
4. Teacher types comment, sets visibility, presses Ctrl+Enter
5. Frontend calls POST /api/v1/grading/submissions/:id/comments
   - Body: { content, startOffset, endOffset, originalContextSnippet, visibility }
6. Backend creates TeacherComment record
7. Frontend invalidates detail query → refetch includes new comment
8. Comment appears in mixed feed + text anchor highlights in student work
```

### Data Flow for Comment Creation (General)

```
1. Teacher clicks "Add a comment..." at bottom of feedback pane
2. AddCommentInput expands to textarea
3. Teacher types comment, sets visibility, presses Ctrl+Enter
4. Frontend calls POST /api/v1/grading/submissions/:id/comments
   - Body: { content, startOffset: null, endOffset: null, visibility }
5. Backend creates TeacherComment with null offsets
6. Frontend invalidates detail query → comment appears in feed without anchor
```

### Character Offset Mapping from DOM Selection

The `useTextSelection` hook needs to convert a browser `Selection`/`Range` to character offsets in the answer text. Strategy:

```typescript
// HighlightedText segments already have data-char-start attributes:
// <span data-char-start="42">some text</span>

// On text selection:
const selection = window.getSelection();
const range = selection.getRangeAt(0);

// Find the segment span containing the start of the selection
const startContainer = range.startContainer;
const startSpan = startContainer.parentElement?.closest('[data-char-start]');
const segmentStart = parseInt(startSpan?.dataset.charStart ?? '0');
const localStartOffset = segmentStart + range.startOffset;

// Same for end
const endContainer = range.endContainer;
const endSpan = endContainer.parentElement?.closest('[data-char-start]');
const segmentEnd = parseInt(endSpan?.dataset.charStart ?? '0');
const localEndOffset = segmentEnd + range.endOffset;

// These are LOCAL offsets within a single answer
// Convert to GLOBAL offsets using the multi-answer mapping:
// globalOffset = answer[N].globalStartOffset + localOffset
```

**Edge cases:**
- Selection spans multiple segments (highlighted + plain text): handled by `closest('[data-char-start]')` on both start and end containers
- Selection spans multiple paragraphs: works because offsets are cumulative across paragraphs (newlines counted)
- Selection includes highlighted AI text: valid — teacher can comment on same text AI flagged
- Selection is entirely within one segment: simplest case, direct offset calculation
- **Selection spans multiple answers: REJECT** — if `range.startContainer` and `range.endContainer` are in different answer `<div>` elements, discard the selection. Cross-answer offsets are invalid because the separator `"\n\n"` between answers would be included. The `useTextSelection` hook checks this by verifying both containers share the same answer ancestor (`closest('[data-answer-index]')`)
- **Empty selection (click without drag):** ignore — only process selections where `selection.toString().trim().length > 0`

### Mixed Feed Ordering

The feed renders in this order:
1. **Band Score Card** (existing — top of pane)
2. **General Feedback** (existing — AI summary)
3. **AI Feedback Items** (existing — grouped by type: grammar, vocabulary, coherence, etc.)
4. **Separator**: "Teacher Comments"
5. **Teacher Comments** (new — chronological by `createdAt ASC`)
6. **Add Comment Input** (new — always at bottom)

This ordering ensures AI feedback is seen first (primary grading context), then teacher additions below. Within teacher comments, chronological order preserves the teacher's annotation flow.

### Teacher Comment Highlight Colors

Teacher comments use **emerald** (green) to visually distinguish from AI feedback:

| Source | Active Highlight BG | Line Stroke | Card Ring |
|--------|-------------------|------------|-----------|
| AI (error) | `bg-red-100` | `#EF4444` | `ring-red-500` |
| AI (warning) | `bg-amber-100` | `#F59E0B` | `ring-amber-500` |
| AI (suggestion) | `bg-blue-100` | `#2563EB` | `ring-primary` |
| **Teacher** | `bg-emerald-100 dark:bg-emerald-900/30` | `#10B981` (emerald-500) | `ring-emerald-500` |

### Existing Components to MODIFY (DO NOT RECREATE)

| Component | File | Changes |
|-----------|------|---------|
| `AIFeedbackPane` | `src/features/grading/components/AIFeedbackPane.tsx` | Accept `teacherComments` prop, render TeacherCommentCards in mixed feed, add AddCommentInput at bottom |
| `StudentWorkPane` | `src/features/grading/components/StudentWorkPane.tsx` | Accept `onCreateComment` prop, add `useTextSelection` hook, render `CommentPopover`, merge teacher anchors into feedbackItems |
| `HighlightedText` | `src/features/grading/components/HighlightedText.tsx` | Add `data-char-start` attrs to segments, add emerald color for `null` severity |
| `ConnectionLineOverlay` | `src/features/grading/components/ConnectionLineOverlay.tsx` | Add emerald stroke color for teacher comments (null severity) |
| `FeedbackItemCard` | `src/features/grading/components/FeedbackItemCard.tsx` | Extract orphaned/drifted indicator rendering to shared `AnchorStatusIndicator`, import and use it |
| `GradingQueuePage` | `src/features/grading/GradingQueuePage.tsx` | Extract teacherComments from detail, initialize comment mutation hooks, wire all comment callbacks, extend anchor status computation, pass severity for teacher comments to overlay |
| `grading-keys.ts` | `src/features/grading/hooks/grading-keys.ts` | Add `comments` query key |
| `grading.service.ts` | `apps/backend/src/modules/grading/grading.service.ts` | Add 4 CRUD methods, modify `getAnalysisResults` to include comments |
| `grading.controller.ts` | `apps/backend/src/modules/grading/grading.controller.ts` | Add 4 controller methods, update `getSubmissionDetail` |
| `grading.routes.ts` | `apps/backend/src/modules/grading/grading.routes.ts` | Add 4 new routes, update detail response schema |
| `grading.ts` (types) | `packages/types/src/grading.ts` | Add all comment schemas and types |
| `schema.prisma` | `packages/db/prisma/schema.prisma` | Add `TeacherComment` model, update `Submission` relation |

### New Components to CREATE

| Component | File | Purpose |
|-----------|------|---------|
| `TeacherCommentCard` | `src/features/grading/components/TeacherCommentCard.tsx` | Teacher comment display with badge, visibility toggle, edit/delete, delete confirmation AlertDialog |
| `CommentPopover` | `src/features/grading/components/CommentPopover.tsx` | Absolutely-positioned comment input near text selection (NOT shadcn Popover) |
| `AddCommentInput` | `src/features/grading/components/AddCommentInput.tsx` | Collapsible general comment input at feed bottom |
| `AnchorStatusIndicator` | `src/features/grading/components/AnchorStatusIndicator.tsx` | Shared component for orphaned/drifted anchor indicators — used by both `FeedbackItemCard` and `TeacherCommentCard` to prevent logic duplication. Renders: orphaned → muted "Anchor lost" + `Unlink` icon, drifted → amber dot with title tooltip |

### New Hooks to CREATE

| Hook | File | Purpose |
|------|------|---------|
| `useTextSelection` | `hooks/use-text-selection.ts` | Tracks text selection + computes character offsets in student work |
| `useCreateComment` | `hooks/use-create-comment.ts` | TanStack mutation for creating comments |
| `useUpdateComment` | `hooks/use-update-comment.ts` | TanStack mutation for updating comments |
| `useDeleteComment` | `hooks/use-delete-comment.ts` | TanStack mutation for deleting comments |

### API Endpoints (New)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/v1/grading/submissions/:submissionId/comments` | Create teacher comment | TEACHER/ADMIN/OWNER |
| GET | `/api/v1/grading/submissions/:submissionId/comments` | List comments for submission | TEACHER/ADMIN/OWNER |
| PATCH | `/api/v1/grading/submissions/:submissionId/comments/:commentId` | Update comment | TEACHER/ADMIN/OWNER |
| DELETE | `/api/v1/grading/submissions/:submissionId/comments/:commentId` | Delete comment | TEACHER/ADMIN/OWNER |

### Component Import Paths (Established Project Pattern)

All shadcn components import from `@workspace/ui/components/`:
```typescript
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@workspace/ui/components/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
// Icons from lucide-react directly:
import { Eye, EyeOff, Pencil, Trash2, User, MoreHorizontal, Unlink, MessageSquare } from "lucide-react";
// Toast from sonner:
import { toast } from "sonner";
// API client:
import { client } from "@/core/client";
// Auth:
import { useAuth } from "@/features/auth/auth-context";
```

### Existing Dependencies (NO NEW PACKAGES NEEDED)

| Package | Usage in This Story |
|---------|---------------------|
| `lucide-react` | `Eye`, `EyeOff`, `Pencil`, `Trash2`, `User`, `MessageSquare`, `Unlink` icons |
| `date-fns` | `formatDistanceToNow` for relative timestamps |
| `tailwindcss` | All styling |
| `@radix-ui/*` (via shadcn) | AlertDialog, DropdownMenu, Popover, Badge, Textarea, Separator |
| `react` | Context, refs, memo, useCallback, useMemo, useState |
| `@tanstack/react-query` | useMutation, useQueryClient, invalidateQueries |

### Scope Boundaries — What This Story Does NOT Implement

| Feature | Story | Status |
|---------|-------|--------|
| Accept/reject AI suggestions (`isApproved` UI) | 5.4 | Backlog |
| Teacher score override | 5.4 | Backlog |
| "Approve & Next" action | 5.4 | Backlog |
| Student Feedback View page | 5.6 | Backlog |
| Grading Queue Management page | 5.5 | Backlog |
| Markdown/rich text in comments | Not planned | — |
| Comment threading/replies | Not planned | — |
| @mentions in comments | Not planned | — |
| File attachments on comments | Not planned | — |

### Previous Story Intelligence (from 5-3)

**Patterns established in Story 5.3 that this story MUST follow:**
- **HighlightedText:** renders text in segments with severity-based colors. Each segment tracks its character offset — this story adds `data-char-start` attributes to expose these offsets for text selection
- **Highlight context:** split value/setter pattern with 50ms debounce for mouse events. Teacher comment cards participate in the same system — no changes to the context itself
- **Anchor validation:** `validateAnchor` pure function with Levenshtein similarity. Reuse directly for teacher comment anchors — same thresholds (80%/50%)
- **ConnectionLineOverlay:** queries DOM via `data-card-id` and `data-feedback-id`. Teacher comments use the same DOM attributes with their comment IDs
- **FeedbackItemCard hover/focus pattern:** `onMouseEnter → onHighlight(id)`, `onMouseLeave → onHighlight(null)`, `tabIndex={0}`, `React.memo`. TeacherCommentCard follows identical pattern
- **Multi-answer offset mapping:** `globalStartOffset` computed per answer. Teacher text selection uses the same mapping for offset calculation
- **useMediaQuery:** extracted to shared hook. No changes needed

**Code review findings from 5-3 that apply:**
- Use stable `useMemo`/`useCallback` references for derived data and callbacks
- Clean up event listeners on unmount (selection listeners, popover handlers)
- Test mocks should be wrapped in `act()` for state updates
- Use `aria-label` and `aria-details` for accessibility on interactive elements

### Project Structure Notes

```
apps/webapp/src/features/grading/
├── GradingQueuePage.tsx                  # MODIFIED — wire comment hooks + props
├── components/
│   ├── AIFeedbackPane.tsx                # MODIFIED — mixed feed, AddCommentInput
│   ├── StudentWorkPane.tsx               # MODIFIED — text selection, CommentPopover
│   ├── HighlightedText.tsx               # MODIFIED — data-char-start attrs, emerald color
│   ├── ConnectionLineOverlay.tsx         # MODIFIED — emerald stroke color
│   ├── FeedbackItemCard.tsx              # MODIFIED — extract anchor indicators to shared AnchorStatusIndicator
│   ├── TeacherCommentCard.tsx            # NEW — teacher comment card with delete AlertDialog
│   ├── CommentPopover.tsx                # NEW — absolutely-positioned comment input near selection
│   ├── AddCommentInput.tsx               # NEW — general comment input
│   └── AnchorStatusIndicator.tsx         # NEW — shared orphaned/drifted indicator (used by both card types)
├── hooks/
│   ├── grading-keys.ts                   # MODIFIED — add comments key
│   ├── use-teacher-comments.ts           # NEW — query hook (fallback)
│   ├── use-create-comment.ts             # NEW — create mutation
│   ├── use-update-comment.ts             # NEW — update mutation
│   ├── use-delete-comment.ts             # NEW — delete mutation
│   └── use-text-selection.ts             # NEW — text selection hook
└── __tests__/
    ├── TeacherCommentCard.test.tsx        # NEW — 8 tests
    ├── CommentPopover.test.tsx            # NEW — 6 tests
    ├── AddCommentInput.test.tsx           # NEW — 4 tests
    ├── use-text-selection.test.ts         # NEW — 4 tests
    ├── use-create-comment.test.ts         # NEW — 3 tests
    └── teacher-commenting.test.tsx        # NEW — 5 integration tests

apps/backend/src/modules/grading/
├── grading.routes.ts                     # MODIFIED — 4 new comment routes
├── grading.controller.ts                 # MODIFIED — 4 new controller methods
├── grading.service.ts                    # MODIFIED — 4 CRUD methods + update getAnalysisResults
├── grading.service.test.ts               # MODIFIED — 8 new tests
└── grading.routes.integration.test.ts    # MODIFIED — 10 new tests

packages/types/src/
└── grading.ts                            # MODIFIED — comment schemas + types

packages/db/prisma/
├── schema.prisma                         # MODIFIED — TeacherComment model
└── migrations/XXXXXX_add_teacher_comment_model/  # NEW — migration
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 — Story 5.7 (FR49-FR53)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Layered architecture, feature-first structure, multi-tenancy]
- [Source: _bmad-output/implementation-artifacts/5-3-evidence-anchoring.md — Highlight system, anchor validation, ConnectionLineOverlay, multi-answer offset mapping]
- [Source: project-context.md — Route-Controller-Service pattern, getTenantedClient, Prisma conventions, testing rules]
- [Source: packages/types/src/grading.ts — Existing type definitions, schema patterns]
- [Source: packages/db/prisma/schema.prisma — SubmissionFeedback/AIFeedbackItem models, Submission model]
- [Source: apps/backend/src/modules/grading/grading.service.ts — verifyAccess pattern, getAnalysisResults includes]
- [Source: apps/backend/src/modules/grading/grading.routes.ts — Route registration pattern, auth middleware]
- [Source: apps/webapp/src/features/grading/GradingQueuePage.tsx — Data flow, anchor status computation]
- [Source: apps/webapp/src/features/grading/components/AIFeedbackPane.tsx — Feed rendering, FeedbackItem interface]
- [Source: apps/webapp/src/features/grading/components/StudentWorkPane.tsx — Multi-answer offset mapping, feedbackItems prop]
- [Source: apps/webapp/src/features/grading/components/HighlightedText.tsx — Segment rendering, severity colors]
- [Source: apps/webapp/src/features/grading/hooks/use-highlight-context.tsx — Split context, highlight state management]
- [Source: apps/webapp/src/features/grading/hooks/use-anchor-validation.ts — validateAnchor, calculateSimilarity]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed Prisma integration test: added `teacherComment` mock to `mockDb` in `grading.routes.integration.test.ts`
- Fixed `AnchorStatusIndicator` component: added `variant: "dot" | "label"` prop to handle two rendering locations

### Completion Notes List

- All 13 tasks completed successfully
- Backend: 4 new CRUD API endpoints for teacher comments + modified `getAnalysisResults` to include comments
- Frontend: 4 new components (TeacherCommentCard, CommentPopover, AddCommentInput, AnchorStatusIndicator), 4 new hooks, text selection with character offset mapping
- Mixed feed integration with emerald color scheme for teacher comments
- Tests: Backend service tests (15 new tests), frontend hook tests (6), component tests (23 across 3 files)
- All tests pass: Backend 696 passed, Frontend 762 passed

### Code Review — Adversarial Review Fixes Applied

**Review model:** Claude Opus 4.6

**Findings fixed (10 total):**

1. **CRITICAL #1** — Missing backend integration tests for comment CRUD. Story claimed 10 tests in Task 13.2 but only had teacherComment mock in beforeEach. **Fix:** Added 10 integration tests covering POST/GET/PATCH/DELETE with auth, validation, 404, and 403 scenarios.

2. **CRITICAL #2** — Missing `use-text-selection.test.ts`. Story claimed 4 tests in Task 13.7 but file didn't exist. **Fix:** Created test file with 5 tests: initial null state, mouseup detection, cross-answer rejection, Escape clearing, global offset computation for second answer.

3. **CRITICAL #3** — Missing `teacher-commenting.test.tsx`. Story claimed 5 integration tests in Task 13.8 but file didn't exist. **Fix:** Created integration test with 5 tests: mixed feed rendering, general comment display, feed ordering (AI before teacher), AddCommentInput submission, and comment availability during analysis.

4. **HIGH #4** — `TeacherCommentCard` AnchorStatusIndicator dot was placed inside an empty `<div className="relative">`, floating detached from the Teacher badge. **Fix:** Moved dot variant to wrap the Teacher Badge with a relative container.

5. **HIGH #5** — `schema.d.ts` missing from File List. **Fix:** Added to Modified files in File List below.

6. **MEDIUM #6** — Unstable `onCancel` callback in `StudentWorkPane.tsx`. Inline arrow `() => { clearSelection(); ... }` caused unnecessary re-renders of `CommentPopover`. **Fix:** Extracted as memoized `handleCommentCancel` via `useCallback`.

7. **MEDIUM #7** — Repeated `{ ...comment, authorName: ..., authorAvatarUrl: ..., author: undefined }` pattern 4 times in `grading.service.ts`. **Fix:** Extracted `mapCommentWithAuthor()` helper with proper destructuring (no `author: undefined` in output).

8. **MEDIUM #8** — Whitespace-only comments passed validation (`" "` → `min(1)` passes). **Fix:** Added `.trim()` to both `CreateTeacherCommentSchema` and `UpdateTeacherCommentSchema` content fields in `packages/types/src/grading.ts`.

9. **LOW #9** — No issues found with LOW severity requiring code changes.

10. **LOW #10** — `useTeacherComments` hook is only used as fallback but imported — acceptable by design since submission detail provides comments inline.

**Updated test counts after review:**
- Backend: 706 tests passing (was 696 → +10 integration tests)
- Frontend: 772 tests passing (was 762 → +5 use-text-selection + 5 teacher-commenting integration)

### File List

**Modified:**
- `packages/db/prisma/schema.prisma` — TeacherComment model + reverse relations
- `packages/types/src/grading.ts` — Comment schemas and types (+ `.trim()` on content fields from review)
- `apps/backend/src/modules/grading/grading.service.ts` — 4 CRUD methods + getAnalysisResults (+ `mapCommentWithAuthor` extraction from review)
- `apps/backend/src/modules/grading/grading.controller.ts` — 4 controller methods + getSubmissionDetail
- `apps/backend/src/modules/grading/grading.routes.ts` — 4 new routes
- `apps/backend/src/modules/grading/grading.service.test.ts` — Teacher comment tests
- `apps/backend/src/modules/grading/grading.routes.integration.test.ts` — Added teacherComment mock + 10 comment CRUD integration tests from review
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated from backend OpenAPI spec (DO NOT EDIT DIRECTLY)
- `apps/webapp/src/features/grading/GradingQueuePage.tsx` — Comment wiring
- `apps/webapp/src/features/grading/components/AIFeedbackPane.tsx` — Mixed feed + TeacherCommentsSection
- `apps/webapp/src/features/grading/components/StudentWorkPane.tsx` — Text selection + onCreateComment (+ `handleCommentCancel` useCallback from review)
- `apps/webapp/src/features/grading/components/HighlightedText.tsx` — data-char-start attrs + emerald color
- `apps/webapp/src/features/grading/components/ConnectionLineOverlay.tsx` — Emerald stroke color
- `apps/webapp/src/features/grading/components/FeedbackItemCard.tsx` — AnchorStatusIndicator refactor
- `apps/webapp/src/features/grading/components/TeacherCommentCard.tsx` — Fixed AnchorStatusIndicator dot placement from review
- `apps/webapp/src/features/grading/hooks/grading-keys.ts` — comments query key

**Created:**
- `packages/db/prisma/migrations/20260217035712_add_teacher_comment_model/` — Migration
- `apps/webapp/src/features/grading/components/TeacherCommentCard.tsx`
- `apps/webapp/src/features/grading/components/CommentPopover.tsx`
- `apps/webapp/src/features/grading/components/AddCommentInput.tsx`
- `apps/webapp/src/features/grading/components/AnchorStatusIndicator.tsx`
- `apps/webapp/src/features/grading/hooks/use-text-selection.ts`
- `apps/webapp/src/features/grading/hooks/use-create-comment.ts`
- `apps/webapp/src/features/grading/hooks/use-update-comment.ts`
- `apps/webapp/src/features/grading/hooks/use-delete-comment.ts`
- `apps/webapp/src/features/grading/hooks/use-teacher-comments.ts`
- `apps/webapp/src/features/grading/__tests__/comment-hooks.test.ts`
- `apps/webapp/src/features/grading/__tests__/TeacherCommentCard.test.tsx`
- `apps/webapp/src/features/grading/__tests__/CommentPopover.test.tsx`
- `apps/webapp/src/features/grading/__tests__/AddCommentInput.test.tsx`
- `apps/webapp/src/features/grading/__tests__/use-text-selection.test.ts` — Added from review (CRITICAL #2)
- `apps/webapp/src/features/grading/__tests__/teacher-commenting.test.tsx` — Added from review (CRITICAL #3)
