# Story 3.6: Listening Exercise Builder

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to create Listening exercises with audio files,
so that students can practice IELTS Listening skills.

## Acceptance Criteria

1. **AC1: Audio Upload** — Upload MP3, WAV, or M4A files (max 100MB). System shows upload progress, file name, and duration after upload. Audio is stored in Firebase Storage at path `exercises/${centerId}/${exerciseId}/audio/${timestamp}.${ext}` following the existing diagram upload pattern. Upload replaces any previous audio (one audio file per exercise). A "Remove audio" button deletes the stored file and clears the `audioUrl` field.

2. **AC2: Audio Sections** — Teacher can mark section timestamps (e.g., "Section 1: 0:00-3:45") for multi-part audio. Sections are stored in the `audioSections` JSON field on the Exercise model. Each section has a label, start time (seconds), and end time (seconds). Sections must not overlap and must be within the audio duration. Minimum 0 sections (optional), no maximum. Sections are editable inline with add/remove controls. Section labels default to "Section 1", "Section 2", etc.

3. **AC3: Playback Modes** — Configure per exercise:
   - **Test Mode:** Single play only (audio plays once, then locks). Students cannot replay. The audio player disables the play button after the first complete playback.
   - **Practice Mode:** Unlimited replay with seek bar and speed control (0.75x, 1x, 1.25x).
   Default: Practice Mode. Stored as `playbackMode` enum field on the Exercise model (`TEST_MODE` or `PRACTICE_MODE`).

4. **AC4: Transcript** — Optional transcript upload/paste. Teacher can paste text into a textarea or the existing PassageEditor. Stored in the existing `passageContent` field (reused for Listening exercises as transcript content). Can be revealed to student after submission (controlled by a `showTranscriptAfterSubmit` boolean field on the Exercise model, default: false). The "Passage" editor label changes to "Transcript (Optional)" when skill is LISTENING.

5. **AC5: Question Timing** — Questions can be linked to audio sections (appear after that section plays). Each QuestionSection can have an optional `audioSectionIndex` field (nullable integer) linking it to an audio section by index. When linked, in the student view (Story 3.7/4.1 scope), questions for that section only appear after the corresponding audio section finishes playing. In the teacher's editor, a dropdown per section allows linking to an audio section or "Show all at once" (null). **This story implements the data model and teacher-facing UI only.** Student-facing progressive display is Story 3.7/4.1 scope.

## Tasks / Subtasks

### Backend Tasks

- [x] **Task 1: Add audio and listening fields to Prisma schema** (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Add to `Exercise` model in `packages/db/prisma/schema.prisma`:
    ```prisma
    audioUrl                 String?  @map("audio_url")
    audioDuration            Int?     @map("audio_duration")     // seconds
    playbackMode             String?  @map("playback_mode")      // "TEST_MODE" or "PRACTICE_MODE"
    audioSections            Json?    @map("audio_sections")     // [{label, startTime, endTime}]
    showTranscriptAfterSubmit Boolean @default(false) @map("show_transcript_after_submit")
    ```
    **Note:** `playbackMode` is stored as `String?` (not enum) to avoid a Prisma migration for adding enum values later. Validation is enforced at the Zod schema level. `passageContent` (existing field) is reused for transcript storage — no new column needed.
  - [x] 1.2 Add `audioSectionIndex` to `QuestionSection` model:
    ```prisma
    audioSectionIndex Int? @map("audio_section_index")
    ```
  - [x] 1.3 Run `pnpm --filter=db db:push` to sync schema.
  - [x] 1.4 Run `pnpm --filter=db db:generate` to regenerate Prisma client.

- [x] **Task 2: Update Zod schemas in packages/types** (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Add `PlaybackModeSchema` and `AudioSectionSchema` to `packages/types/src/exercises.ts`:
    ```typescript
    export const PlaybackModeSchema = z.enum(["TEST_MODE", "PRACTICE_MODE"]);
    export type PlaybackMode = z.infer<typeof PlaybackModeSchema>;

    export const AudioSectionSchema = z.object({
      label: z.string().min(1),
      startTime: z.number().min(0),
      endTime: z.number().min(0),
    }).refine(s => s.endTime > s.startTime, {
      message: "endTime must be greater than startTime",
    });
    export type AudioSection = z.infer<typeof AudioSectionSchema>;
    ```
  - [x] 2.2 Add audio fields to `ExerciseSchema`:
    ```typescript
    audioUrl: z.string().nullable().optional(),
    audioDuration: z.number().nullable().optional(),
    playbackMode: PlaybackModeSchema.nullable().optional(),
    audioSections: z.array(AudioSectionSchema).nullable().optional(),
    showTranscriptAfterSubmit: z.boolean().default(false),
    ```
  - [x] 2.3 Add audio fields to `CreateExerciseSchema`:
    ```typescript
    playbackMode: PlaybackModeSchema.optional(),
    showTranscriptAfterSubmit: z.boolean().optional().default(false),
    ```
    **Note:** `audioUrl` and `audioDuration` are NOT in CreateExercise — they are set via the upload route.
  - [x] 2.4 Add audio fields to `UpdateExerciseSchema`:
    ```typescript
    playbackMode: PlaybackModeSchema.optional(),
    audioSections: z.array(AudioSectionSchema).nullable().optional(),
    showTranscriptAfterSubmit: z.boolean().optional(),
    ```
  - [x] 2.5 Add `audioSectionIndex` to `QuestionSectionSchema`, `CreateQuestionSectionSchema`, `UpdateQuestionSectionSchema`:
    ```typescript
    audioSectionIndex: z.number().int().min(0).nullable().optional(),
    ```
  - [x] 2.6 Add `AutosaveExerciseSchema` fields for audio metadata autosave:
    ```typescript
    playbackMode: PlaybackModeSchema.optional(),
    audioSections: z.array(AudioSectionSchema).nullable().optional(),
    showTranscriptAfterSubmit: z.boolean().optional(),
    ```

- [x] **Task 3: Add audio upload route and service method** (AC: #1)
  - [x] 3.1 Add `uploadAudio()` method to `ExercisesService` in `exercises.service.ts`:
    ```typescript
    async uploadAudio(
      centerId: string,
      exerciseId: string,
      fileBuffer: Buffer,
      contentType: string,
    ): Promise<{ audioUrl: string }> {
      const db = getTenantedClient(this.prisma, centerId);
      // MUST verify DRAFT status first (reuse verifyDraftExercise helper)
      await this.verifyDraftExercise(db, exerciseId, "Only draft exercises can have audio uploaded");
      // Follow uploadDiagram() pattern exactly
      // Path: exercises/${centerId}/${exerciseId}/audio/${Date.now()}.${ext}
      // MIME map: audio/mpeg → mp3, audio/wav → wav, audio/mp4 → m4a, audio/x-m4a → m4a
      // Make file public, return URL
      // Update exercise record with audioUrl via db.exercise.update()
    }
    ```
    **Key difference from diagram upload:** After uploading to Firebase Storage, also update the Exercise DB record with the `audioUrl`. This avoids a second API call from the frontend.
    **IMPORTANT:** Must call `verifyDraftExercise()` before uploading — all exercise modifications are draft-only. The existing helper throws `AppError.badRequest()` if not DRAFT.
  - [x] 3.2 Add `deleteAudio()` method to `ExercisesService`:
    ```typescript
    async deleteAudio(centerId: string, exerciseId: string): Promise<void> {
      const db = getTenantedClient(this.prisma, centerId);
      // MUST verify DRAFT status first
      const exercise = await this.verifyDraftExercise(db, exerciseId, "Only draft exercises can have audio removed");
      // Load exercise to get current audioUrl
      // Parse file path from URL (strip https://storage.googleapis.com/{bucket}/ prefix)
      // Delete from Firebase Storage
      // Update exercise: audioUrl = null, audioDuration = null, audioSections = null
      // Also clear audioSectionIndex on all related QuestionSections
    }
    ```
  - [x] 3.3 Add audio upload route to `exercises.routes.ts`:
    ```typescript
    // POST /:exerciseId/audio - Upload audio file
    // Route-level file size override: 100MB for audio
    // Allowed mimetypes: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"]
    // Returns: { data: { audioUrl }, message: "Audio uploaded" }
    ```
    Follow the existing diagram upload route pattern (lines 408-486) exactly.
  - [x] 3.4 Add audio delete route to `exercises.routes.ts`:
    ```typescript
    // DELETE /:exerciseId/audio - Remove audio file
    // Returns: { message: "Audio removed" }
    ```
  - [x] 3.5 Add `uploadAudio` and `deleteAudio` methods to `ExercisesController`:
    Same pass-through pattern as other controller methods.

- [x] **Task 4: Update exercise service to handle audio fields in CRUD** (AC: #2, #3, #4, #5)
  - [x] 4.1 Update `updateDraftExercise()` in `exercises.service.ts` to handle new fields:
    ```typescript
    ...("playbackMode" in input && input.playbackMode !== undefined && {
      playbackMode: input.playbackMode,
    }),
    ...("audioSections" in input && input.audioSections !== undefined && {
      audioSections: input.audioSections,
    }),
    ...("showTranscriptAfterSubmit" in input && input.showTranscriptAfterSubmit !== undefined && {
      showTranscriptAfterSubmit: input.showTranscriptAfterSubmit,
    }),
    ```
  - [x] 4.2 Update `createExercise()` to handle `playbackMode` and `showTranscriptAfterSubmit`:
    ```typescript
    playbackMode: input.playbackMode ?? null,
    showTranscriptAfterSubmit: input.showTranscriptAfterSubmit ?? false,
    ```

- [x] **Task 5: Update sections service for audioSectionIndex** (AC: #5)
  - [x] 5.1 In `sections.service.ts` `createSection()` method, add explicit field handling (the method uses an explicit field whitelist, NOT dynamic passthrough):
    ```typescript
    // Add to the data object in createSection():
    ...(input.audioSectionIndex !== undefined && { audioSectionIndex: input.audioSectionIndex }),
    ```
  - [x] 5.2 In `sections.service.ts` `updateSection()` method, add the same explicit field handling:
    ```typescript
    // Add to the data spread in updateSection():
    ...(input.audioSectionIndex !== undefined && { audioSectionIndex: input.audioSectionIndex }),
    ```
  **IMPORTANT:** Both `createSection()` and `updateSection()` explicitly whitelist every field they write to the database (see `sectionType`, `instructions`, `orderIndex` pattern). Simply adding `audioSectionIndex` to the Zod schema will NOT make it persist — you MUST add the explicit conditional spread above.

### Frontend Tasks

- [x] **Task 6: Create useAudioUpload hook** (AC: #1)
  - [x] 6.1 Create `apps/webapp/src/features/exercises/hooks/use-audio-upload.ts`:
    Follow `use-diagram-upload.ts` pattern exactly:
    ```typescript
    export function useAudioUpload() {
      return useMutation({
        mutationFn: async ({ exerciseId, file }: { exerciseId: string; file: File }): Promise<string> => {
          const formData = new FormData();
          formData.append("file", file);
          const { data, error } = await client.POST(
            "/api/v1/exercises/{exerciseId}/audio",
            { params: { path: { exerciseId } }, body: formData as any },
          );
          if (error) throw new Error((error as { message?: string }).message || "Failed to upload audio");
          if (!data?.data?.audioUrl) throw new Error("Failed to upload audio");
          return data.data.audioUrl;
        },
      });
    }
    ```
  - [x] 6.2 Add `useAudioDelete` mutation in the same file:
    ```typescript
    export function useAudioDelete() {
      return useMutation({
        mutationFn: async ({ exerciseId }: { exerciseId: string }): Promise<void> => {
          const { error } = await client.DELETE(
            "/api/v1/exercises/{exerciseId}/audio",
            { params: { path: { exerciseId } } },
          );
          if (error) throw new Error((error as { message?: string }).message || "Failed to delete audio");
        },
      });
    }
    ```
  - [x] 6.3 Both hooks should invalidate the exercise query cache on success to refresh exercise data.

- [x] **Task 7: Create AudioUploadEditor component** (AC: #1)
  - [x] 7.1 Create `apps/webapp/src/features/exercises/components/AudioUploadEditor.tsx`:
    Props: `exerciseId: string`, `audioUrl: string | null`, `audioDuration: number | null`, `onAudioChange: () => void`
    Features:
    - File input accepting `.mp3,.wav,.m4a` with 100MB max
    - Upload progress indicator (use `mutate.isPending` state)
    - After upload: show file name, duration display (mm:ss format), and basic HTML5 `<audio>` element with controls for playback preview
    - "Remove audio" button with confirmation
    - Error toast on upload failure (invalid type, too large, server error)
    - Drop zone UI: dashed border area with "Drag audio file here or click to upload" text and upload icon
  - [x] 7.2 Audio duration: Extract duration from the uploaded file **client-side** using HTML5 Audio API. This is a **two-step save flow**:
    1. **Step 1 (upload):** `uploadAudio()` saves file to Firebase Storage and updates exercise with `audioUrl`
    2. **Step 2 (duration):** Client extracts duration and calls `updateExercise({ audioDuration })` as a **separate** API call
    ```typescript
    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.round(audio.duration); // seconds
      URL.revokeObjectURL(audio.src); // cleanup
      // Save duration via exercise update mutation (separate API call)
    });
    ```
    **Handle intermediate state:** Between step 1 and step 2, the exercise has `audioUrl` but `audioDuration` is null. The `AudioSectionMarkers` component must handle this gracefully (disable section markers until duration is available). The `AudioUploadEditor` should show a brief "Processing..." state while extracting duration.
    **Note:** `loadedmetadata` fires quickly — browsers read audio headers without decoding the full file, so even 100MB files resolve fast. No need for a heavy loading state.
  - [x] 7.3 Use `Upload`, `Trash2`, `Music`, `FileAudio` icons from `lucide-react`.

- [x] **Task 8: Create AudioSectionMarkers component** (AC: #2)
  - [x] 8.1 Create `apps/webapp/src/features/exercises/components/AudioSectionMarkers.tsx`:
    Props: `sections: AudioSection[]`, `audioDuration: number | null`, `onSectionsChange: (sections: AudioSection[]) => void`
    Features:
    - List of section rows, each showing: Label (editable Input), Start Time (mm:ss Input), End Time (mm:ss Input), Remove button
    - "Add Section" button appends a new section with auto-incremented label ("Section N") and startTime = previous section's endTime (or 0)
    - Time format helper: convert seconds to mm:ss for display, parse mm:ss to seconds on blur
    - Validation: sections must not overlap, endTime > startTime, all times within 0..audioDuration
    - Validation errors shown inline (red text) — do NOT block saves, just warn
    - Only shown when audio is uploaded (audioDuration > 0)
  - [x] 8.2 Wire `onSectionsChange` to exercise update mutation via parent.

- [x] **Task 9: Create PlaybackModeSettings component** (AC: #3)
  - [x] 9.1 Create `apps/webapp/src/features/exercises/components/PlaybackModeSettings.tsx`:
    Props: `playbackMode: PlaybackMode | null`, `onPlaybackModeChange: (mode: PlaybackMode) => void`
    Features:
    - Radio group with two options:
      - **Practice Mode** (default): "Unlimited replay with seek bar and speed control"
      - **Test Mode**: "Single play only. Audio plays once, then locks."
    - Use `RadioGroup` and `RadioGroupItem` from `@workspace/ui` (or create simple radio if not available)
    - Wire to exercise update mutation via parent

- [x] **Task 10: Integrate audio UI into ExerciseEditor** (AC: #1, #2, #3, #4, #5)
  - [x] 10.1 In `ExerciseEditor.tsx`, add audio-specific sections when `selectedSkill === "LISTENING"`:
    ```
    Layout order (for LISTENING exercises):
    ├── Title & Instructions (existing)
    ├── Audio Upload Editor (NEW — Task 7)
    ├── Playback Mode Settings (NEW — Task 9)
    ├── Audio Section Markers (NEW — Task 8, only when audio uploaded)
    ├── Transcript (Optional) — reuse PassageEditor with label change (AC4)
    ├── Answer Key Settings (existing)
    ├── Question Sections (existing, with audio section linking dropdown per section)
    └── Preview (existing)
    ```
  - [x] 10.2 Change PassageEditor label: The label "Reading Passage" is **hardcoded** inside `PassageEditor.tsx` (line 18: `<Label>Reading Passage</Label>`). The component does NOT accept a label prop. You must:
    - Add a `label?: string` prop to the `PassageEditorProps` interface in `PassageEditor.tsx`
    - Default to `"Reading Passage"` when prop not provided
    - In `ExerciseEditor.tsx`, pass `label="Transcript (Optional)"` when `selectedSkill === "LISTENING"`
  - [x] 10.3 Add `showTranscriptAfterSubmit` checkbox below the transcript editor:
    ```
    ☐ Show transcript to student after submission
      (When enabled, students can view the transcript after submitting their answers.)
    ```
    Wire to `updateExercise({ showTranscriptAfterSubmit: checked })`.
  - [x] 10.4 Add audio section linking dropdown to `QuestionSectionEditor`:
    **IMPORTANT:** The current `onUpdateSection` callback signature in `QuestionSectionEditor.tsx` only accepts `{ sectionType?: IeltsQuestionType; instructions?: string | null }`. You must:
    - Widen the `onUpdateSection` callback type to include `audioSectionIndex?: number | null`
    - Update `handleUpdateSection` in `ExerciseEditor.tsx` to pass through `audioSectionIndex`
    - Add a new prop to `QuestionSectionEditor`: `audioSections?: AudioSection[]` (so the dropdown has labels to render)
    - When `skill === "LISTENING"` AND `audioSections` has length > 0:
      - Show a `Select` dropdown in the section header: "Link to audio section: [All at once | Section 1 | Section 2 | ...]"
      - "All at once" = `audioSectionIndex: null`
      - Selection saves via `onUpdateSection(sectionId, { audioSectionIndex: selectedIndex })`
  - [x] 10.5 Import and use the new hooks (`useAudioUpload`, `useAudioDelete`) and components in ExerciseEditor. Pass exercise data as props.
  - [x] 10.6 Auto-save: Add `playbackMode`, `audioSections`, `showTranscriptAfterSubmit` to the autosave mutation payload. These metadata fields should autosave alongside title/instructions/passageContent.

- [x] **Task 11: Update ExercisePreview for Listening** (AC: #1, #4)
  - [x] 11.1 In the `ExercisePreview` component within `ExerciseEditor.tsx`, when the exercise has an `audioUrl`:
    - Show an HTML5 `<audio>` element with `controls` attribute for basic playback
    - Show audio duration in mm:ss format
    - Show section markers as a list below the player (if any)
    - Show transcript section (the passageContent) labeled as "Transcript" instead of "Passage" when skill is LISTENING
    - Show `showTranscriptAfterSubmit` badge indicator: "[Transcript hidden until submission]" or "[Transcript visible after submission]"
  - [x] 11.2 ExercisePreview will need access to exercise object for `audioUrl`, `audioDuration`, `audioSections`, `showTranscriptAfterSubmit`. Update the props interface.

### Testing Tasks

- [x] **Task 12: Backend Tests** (AC: #1-5)
  - [x] 12.1 Unit tests for new Zod schemas in `packages/types/src/exercises.test.ts`:
    - `AudioSectionSchema` — valid/invalid structures, negative times, overlapping sections
    - `PlaybackModeSchema` — valid enum values, invalid strings
    - Updated `ExerciseSchema` — audio fields parse correctly, nullable defaults
    - Updated `QuestionSectionSchema` — `audioSectionIndex` nullable int
  - [x] 12.2 Unit tests for `uploadAudio()` service method (mock Firebase Storage):
    - Correct storage path format
    - Correct MIME type mapping (audio/mpeg → mp3, audio/wav → wav, audio/mp4 → m4a)
    - File made public
    - Exercise record updated with audioUrl
  - [x] 12.3 Unit tests for `deleteAudio()` service method:
    - Rejects non-DRAFT exercises
    - File deleted from storage
    - Exercise record cleared (audioUrl, audioDuration, audioSections nulled)
    - All related QuestionSections have audioSectionIndex cleared to null
  - [x] 12.4 Integration tests for audio upload route.
    **NOTE:** The exercises module currently has **zero `.integration.test.ts` files** — only unit tests with mocked Prisma. Other modules (auth, tenants, logistics) have integration tests. For this story, write **unit tests with mocked Firebase Storage** following the existing `exercises.service.test.ts` pattern. If time permits, create `exercises.integration.test.ts` using patterns from `apps/backend/src/modules/auth/auth.integration.test.ts`.
    Unit test cases for `uploadAudio` service method:
    - Correct storage path format
    - Rejects non-DRAFT exercises (verifyDraftExercise called)
    - Correct MIME type → extension mapping
    - Exercise record updated with audioUrl after upload
    Unit test cases for audio upload route handler:
    - 400 on invalid MIME type
    - 400 on no file
    - 404 on non-existent exercise
    - 401 on unauthenticated
  - [x] 12.5 Integration test for exercise update with audio metadata:
    - Create exercise with LISTENING skill
    - Update with `playbackMode`, `audioSections`, `showTranscriptAfterSubmit`
    - Verify fields returned correctly via GET
  - [x] 12.6 Run: `pnpm --filter=backend test`

- [x] **Task 13: Frontend Tests** (AC: #1-5)
  - [x] 13.1 `AudioUploadEditor` tests:
    - Renders upload zone when no audio
    - Shows audio player when audioUrl present
    - Upload button triggers file input
    - Remove button calls delete mutation
    - Shows upload progress state
  - [x] 13.2 `AudioSectionMarkers` tests:
    - Renders section rows
    - Add section appends with auto-label
    - Remove section deletes row
    - Time format display (seconds to mm:ss)
    - Validation: overlap warning, endTime > startTime
    - Not shown when audioDuration is null
  - [x] 13.3 `PlaybackModeSettings` tests:
    - Renders both radio options
    - Default selection (Practice Mode)
    - Selection change calls handler
  - [x] 13.4 `ExerciseEditor` integration tests for LISTENING:
    - Audio upload editor shown when skill is LISTENING
    - PassageEditor label changes to "Transcript (Optional)" for LISTENING
    - showTranscriptAfterSubmit checkbox renders
    - Audio section linking dropdown in QuestionSectionEditor for LISTENING
  - [x] 13.5 Run: `pnpm --filter=webapp test`

- [x] **Task 14: Schema Sync** (AC: all)
  - [x] 14.1 After Prisma schema changes: `pnpm --filter=db db:generate`
  - [x] 14.2 After backend is running with new routes: `pnpm --filter=webapp sync-schema-dev`
  - [x] 14.3 Verify TS compilation: `npx tsc --noEmit` clean

## Dev Notes

### Architecture Compliance

**Backend Pattern (Route -> Controller -> Service):**
- Exercise CRUD already exists in `exercises.service.ts`, `exercises.controller.ts`, `exercises.routes.ts`. The audio upload follows the **exact same pattern** as the existing diagram upload (Story 3.4).
- `ExercisesService` constructor already receives `firebaseStorage` and `bucketName` — no wiring changes needed.
- New routes (`POST /:exerciseId/audio`, `DELETE /:exerciseId/audio`) follow existing route patterns with auth middleware and role checks.
- New service methods (`uploadAudio`, `deleteAudio`) follow existing `uploadDiagram` pattern.

**Frontend Pattern (Feature-First):**
- New components live in `features/exercises/components/` alongside existing editors.
- New hooks live in `features/exercises/hooks/` alongside `use-diagram-upload.ts`.
- Reuse existing hooks: `useExercises` (`updateExercise` mutation), `useExercise` (data fetch).
- Reuse existing UI patterns: `Collapsible`, `Label`, `Input`, `Button`, `Checkbox` from `@workspace/ui`.

### Multi-Tenancy Requirements

- ALL database queries go through `getTenantedClient(this.prisma, centerId)`.
- Audio files stored with `centerId` in path: `exercises/${centerId}/${exerciseId}/audio/...` — same pattern as diagrams.
- Exercise model already has `centerId` — new columns inherit isolation automatically.

### Database Schema Changes

**Prisma Exercise model additions:**
```prisma
model Exercise {
  // ... existing fields ...
  audioUrl                  String?  @map("audio_url")                    // NEW
  audioDuration             Int?     @map("audio_duration")               // NEW (seconds)
  playbackMode              String?  @map("playback_mode")                // NEW ("TEST_MODE"|"PRACTICE_MODE")
  audioSections             Json?    @map("audio_sections")               // NEW ([{label, startTime, endTime}])
  showTranscriptAfterSubmit Boolean  @default(false) @map("show_transcript_after_submit") // NEW
}
```

**Prisma QuestionSection model addition:**
```prisma
model QuestionSection {
  // ... existing fields ...
  audioSectionIndex Int? @map("audio_section_index") // NEW (nullable, links to audioSections array index)
}
```

**5 new columns on Exercise, 1 new column on QuestionSection. NO new models. NO new relations.**

Run `pnpm --filter=db db:push` after schema changes (development mode, no migration file needed).

### File Upload Infrastructure

**Firebase Storage is already configured and working:**
- Plugin: `apps/backend/src/app.ts` lines 172-180 — `firebasePlugin` with Storage
- Env var: `FIREBASE_STORAGE_BUCKET` (defined in `apps/backend/src/env.ts`)
- Multipart: `@fastify/multipart` registered at lines 188-192 (2MB global default, route-level override supported)
- Reference implementation: `uploadDiagram()` in `exercises.service.ts` lines 227-252

**Audio upload specifics:**
- Route-level file size override: `100 * 1024 * 1024` (100MB) — same pattern as diagram override (5MB)
- MIME types: `["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"]`
- Extension mapping: `audio/mpeg` → `mp3`, `audio/wav` → `wav`, `audio/mp4` → `m4a`, `audio/x-m4a` → `m4a`
- Storage path: `exercises/${centerId}/${exerciseId}/audio/${Date.now()}.${ext}`
- Make file public via `file.makePublic()`, return URL

**Important:** The `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` packages are installed in `package.json` but NOT used in the exercise module. All file uploads use Firebase Storage via `firebase-admin/storage`. DO NOT use S3 for this story.

### Existing Code to Extend (DO NOT Reinvent)

| What | Location | Action |
|------|----------|--------|
| Exercise CRUD | `exercises.service.ts` | Add `uploadAudio()`, `deleteAudio()`. Extend `updateDraftExercise()` with audio fields |
| Exercise routes | `exercises.routes.ts` | Add `POST /:exerciseId/audio`, `DELETE /:exerciseId/audio` |
| Exercise controller | `exercises.controller.ts` | Add `uploadAudio()`, `deleteAudio()` pass-through methods |
| Diagram upload pattern | `exercises.routes.ts:408-486` + `exercises.service.ts:227-252` | **COPY THIS PATTERN** for audio upload — same auth, same error handling, same Firebase Storage flow |
| Diagram upload hook | `use-diagram-upload.ts` | **COPY THIS PATTERN** for `use-audio-upload.ts` |
| Exercise Zod schemas | `packages/types/src/exercises.ts` | Add audio fields to ExerciseSchema, CreateExerciseSchema, UpdateExerciseSchema, AutosaveExerciseSchema |
| QuestionSection schemas | `packages/types/src/exercises.ts` | Add `audioSectionIndex` to QuestionSectionSchema, CreateQuestionSectionSchema, UpdateQuestionSectionSchema |
| QuestionSectionEditor | `QuestionSectionEditor.tsx` | Widen `onUpdateSection` callback to accept `audioSectionIndex`, add `audioSections` prop for dropdown |
| ExerciseEditor | `ExerciseEditor.tsx` | Add audio components for LISTENING skill, change PassageEditor label |
| ExercisePreview | `ExerciseEditor.tsx:64-133` | Add audio player and transcript display for LISTENING |
| PassageEditor | `PassageEditor.tsx` | Add optional `label` prop (currently hardcodes "Reading Passage") |
| Use-exercises hook | `use-exercises.ts` | No change — `updateExercise` mutation exists |
| Multipart plugin | `app.ts:188-192` | No change — already registered |
| Firebase Storage | `app.ts:172-180` | No change — already configured |

### Previous Story Intelligence (Story 3.5)

**Key learnings from 3-2 through 3-5 that apply:**
- **File upload pattern:** Story 3.4 implemented `uploadDiagram()` — exact reference for audio upload. Same Firebase Storage, same route-level file size override, same MIME validation, same public URL return.
- **Debounced updates:** QuestionSectionEditor implements 500ms debounce. Audio metadata updates (playbackMode, audioSections) should use the same `updateExercise` mutation — no need for additional debouncing beyond what exists.
- **onBlur for text inputs:** Use `onBlur` (NOT `onChange`) for text inputs per Story 3.3 H2 fix. Apply to section label inputs and time inputs in AudioSectionMarkers.
- **Null handling:** All new components MUST handle null/undefined audio data gracefully — render empty/upload states, not errors.
- **Test count baseline:** After Story 3.5 — 313 webapp tests, 123 types tests, 49 backend answer-utils tests. Use `pnpm --filter=backend test` and `pnpm --filter=webapp test` to verify current baselines before starting.
- **Existing test patterns to follow:**
  - **Zod schemas:** `packages/types/src/exercises.test.ts` — uses `safeParse()` with `expect(result.success).toBe(true/false)` pattern (103 tests, 23 describe blocks, 1081 lines)
  - **Backend service:** `exercises.service.test.ts` — mocks Prisma with `vi.fn()`, tests via `mockDb.exercise.findMany.mockResolvedValue()`
  - **Frontend components:** `question-editors.test.tsx` — React Testing Library with `vi.mock()` for hooks, `fireEvent` for interactions
  - **Frontend pages:** `exercises-page.test.tsx` — mocks auth context and hooks, tests rendering states
- **Exercise-level settings:** Story 3.5 added `caseSensitive` and `partialCredit` with the Collapsible pattern in ExerciseEditor. Playback mode uses similar UI pattern.

**Commit convention:** `feat(exercises): description` for new features.

### Scope Boundaries (What NOT to Build)

- DO NOT implement student-facing audio playback with test mode locking — that's Story 4.1/3.7 scope (student submission interface)
- DO NOT implement progressive question display during audio playback — that's Story 3.7 scope (listening question types)
- DO NOT implement L1-L6 question type editors or previews — that's Story 3.7 scope
- DO NOT implement audio waveform visualization — use standard HTML5 `<audio>` element with native controls for the teacher preview. Waveform is a nice-to-have enhancement, not in scope.
- DO NOT implement audio transcription (speech-to-text) — transcript is manual paste only in this story
- DO NOT implement audio file format conversion — accept MP3/WAV/M4A as-is
- DO NOT implement audio trimming or editing — teacher uploads complete audio files
- DO NOT implement real-time audio streaming — files are uploaded in full, not streamed
- DO NOT add audio to Reading, Writing, or Speaking exercises — audio upload is LISTENING-only

### Technical Specifics

**Shadcn/UI components to use:**
- `Button` — upload trigger, remove audio, add section
- `Input` — section labels, time inputs
- `Label` — form field labels
- `Checkbox` — showTranscriptAfterSubmit toggle
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` — playback mode, audio section linking dropdown
- `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` — if needed for grouping audio settings
- `Badge` — section markers display, playback mode indicator
- `Upload`, `Trash2`, `Music`, `FileAudio`, `Play`, `Headphones`, `Clock` icons from `lucide-react`

**AudioUploadEditor Layout:**
```
┌─────────────────────────────────────────────┐
│ Audio File                                   │
│                                             │
│  [No audio uploaded]                        │
│  ┌─────────────────────────────────────────┐│
│  │                                         ││
│  │  🎵 Drag audio file here               ││
│  │     or click to upload                  ││
│  │                                         ││
│  │  MP3, WAV, M4A — Max 100MB             ││
│  │                                         ││
│  └─────────────────────────────────────────┘│
│                                             │
│  — OR after upload: —                       │
│                                             │
│  🎵 lecture-section1.mp3 (4:32)            │
│  ┌─────────────────────────────────────────┐│
│  │  ▶ ─────────────────── 0:00 / 4:32     ││
│  └─────────────────────────────────────────┘│
│  [🗑 Remove Audio]                          │
└─────────────────────────────────────────────┘
```

**ExerciseEditor Layout for LISTENING:**
```
ExerciseEditor (LISTENING skill)
├── Title & Instructions (existing)
├── Audio File Upload (NEW — AudioUploadEditor)
├── Playback Mode (NEW — PlaybackModeSettings)
│   ├── ○ Practice Mode (unlimited replay + seek + speed) — default
│   └── ○ Test Mode (single play only)
├── Audio Sections (NEW — AudioSectionMarkers, only when audio uploaded)
│   ├── [Section 1] [0:00] - [3:45] [✕]
│   ├── [Section 2] [3:45] - [7:30] [✕]
│   └── [+ Add Section]
├── Transcript (Optional) — PassageEditor with relabeled heading
│   ├── <textarea for transcript paste>
│   └── ☐ Show transcript to student after submission
├── Answer Key Settings (existing)
├── Question Sections (existing, with audio section linking)
│   ├── Section 1: L1 Form Completion [Linked to: Section 1 ▼]
│   └── Section 2: L2 MCQ [Linked to: All at once ▼]
└── Preview (existing, enhanced with audio player)
```

### Component Tree

```
ExerciseEditor (MODIFY — add audio sections for LISTENING)
├── AudioUploadEditor (NEW — file upload + preview)
├── PlaybackModeSettings (NEW — radio group)
├── AudioSectionMarkers (NEW — section timestamp editor)
├── PassageEditor (MODIFY — add optional `label` prop, default "Reading Passage")
├── AnswerKeySettings (existing, no change)
├── QuestionSectionEditor (MODIFY — widen onUpdateSection callback, add audioSections prop, add linking dropdown)
│   └── QuestionEditorFactory (no change for this story)
└── ExercisePreview (MODIFY — add audio player + transcript display)
```

### Project Structure Notes

```
apps/webapp/src/features/exercises/
├── components/
│   ├── ExerciseEditor.tsx                    # MODIFY — add LISTENING audio sections
│   ├── AudioUploadEditor.tsx                 # NEW — audio file upload + preview
│   ├── AudioSectionMarkers.tsx               # NEW — section timestamp editor
│   ├── PlaybackModeSettings.tsx              # NEW — test/practice mode selector
│   ├── PassageEditor.tsx                     # MODIFY — add optional `label` prop
│   ├── QuestionSectionEditor.tsx             # MODIFY — widen onUpdateSection, add audioSections prop, add linking dropdown
│   └── question-types/                       # NO CHANGES in this story
├── hooks/
│   ├── use-audio-upload.ts                   # NEW — audio upload + delete mutations
│   ├── use-diagram-upload.ts                 # NO CHANGE (reference pattern)
│   ├── use-exercises.ts                      # NO CHANGE
│   └── use-sections.ts                       # NO CHANGE

packages/types/src/
├── exercises.ts                              # MODIFY — add PlaybackMode, AudioSection,
│                                             #           audio fields to Exercise schemas,
│                                             #           audioSectionIndex to Section schemas
└── exercises.test.ts                         # MODIFY — add schema tests

packages/db/prisma/
└── schema.prisma                             # MODIFY — add audio fields to Exercise,
                                              #           audioSectionIndex to QuestionSection

apps/backend/src/modules/exercises/
├── exercises.routes.ts                       # MODIFY — add POST/DELETE audio routes
├── exercises.controller.ts                   # MODIFY — add uploadAudio/deleteAudio
├── exercises.service.ts                      # MODIFY — add uploadAudio/deleteAudio methods,
│                                             #           extend updateDraftExercise with audio fields
├── sections.service.ts                       # MODIFY — pass through audioSectionIndex
└── sections.routes.ts                        # NO CHANGE (section CRUD already handles new fields)
```

### Dependencies

- **Story 3.1 (Exercise Builder Core):** DONE. Exercise CRUD, question sections, passage management all in place.
- **Story 3.2-3.5 (Reading Question Types + Answer Keys):** DONE. All Reading types R1-R14 implemented. Answer key management with variants, word order, and partial credit complete. The `QuestionEditorFactory` and `QuestionPreviewFactory` exist and route question types to their editors.
- **Story 3.4 (Diagram Upload):** DONE. The `uploadDiagram()` service method and `use-diagram-upload.ts` hook are the **exact reference implementation** for this story's audio upload.
- **Story 3.7 (Listening Question Types):** NOT YET. This story only builds the exercise-level audio infrastructure. L1-L6 question type editors and student-facing progressive question display are Story 3.7 scope. The `audioSectionIndex` field on QuestionSection is prepared here for Story 3.7 to consume.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6: Listening Exercise Builder (FR13, FR37)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR37 — Audio upload for Listening exercises]
- [Source: _bmad-output/planning-artifacts/architecture.md#Firebase Storage, @fastify/multipart]
- [Source: project-context.md#Critical Implementation Rules — Multi-tenancy, Type Safety, Layered Architecture]
- [Source: apps/backend/src/modules/exercises/exercises.routes.ts:408-486 — Diagram upload route (reference pattern)]
- [Source: apps/backend/src/modules/exercises/exercises.service.ts:227-252 — uploadDiagram() (reference pattern)]
- [Source: apps/webapp/src/features/exercises/hooks/use-diagram-upload.ts — Frontend upload hook (reference pattern)]
- [Source: apps/webapp/src/features/exercises/components/ExerciseEditor.tsx — Exercise editor layout, skill-based sections]
- [Source: apps/backend/src/app.ts:172-192 — Firebase Storage plugin + multipart plugin registration]
- [Source: apps/backend/src/env.ts — FIREBASE_STORAGE_BUCKET env var]
- [Source: packages/db/prisma/schema.prisma:420-443 — Exercise model, 420-483 — Question models]
- [Source: packages/types/src/exercises.ts:336-387 — Exercise Zod schemas (ExerciseSchema, CreateExerciseSchema, UpdateExerciseSchema)]
- [Source: _bmad-output/implementation-artifacts/3-5-answer-key-management.md — Previous story learnings]
- [Source: _bmad-output/implementation-artifacts/3-4-reading-question-types-advanced.md — Diagram upload implementation]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Code Review Fixes Applied (2026-02-08):**
- **H2 fix:** `ExerciseSchema.playbackMode` changed from `z.string()` to `PlaybackModeSchema.nullable().optional()` for proper type safety
- **H3 fix:** `ExerciseSchema.audioSections` changed from `z.unknown()` to `z.array(AudioSectionSchema).nullable().optional()` — eliminated unsafe casts in ExerciseEditor
- **H4 fix:** Added 8 missing AudioUploadEditor tests (render states, upload, delete, file input, pending states)
- **M1 fix:** Audio section linking dropdown label changed from "No audio section" to "Show all at once" per AC5
- **M2 fix:** PlaybackModeSettings moved outside audioUrl conditional — now visible immediately for LISTENING exercises
- **M3 fix:** AudioUploadEditor integration tests added as part of H4 fix
- **M4 fix:** PassageEditor accepts optional `placeholder` prop; LISTENING exercises show "Enter the transcript here..." placeholder
- **L1 fix:** showTranscriptAfterSubmit checkbox positioning kept consistent with PlaybackModeSettings (both outside audioUrl gate)
- **L2 fix:** AudioSectionMarkers label input changed from `onChange`+`onBlur` to `onBlur`-only with `defaultValue` (matches time input pattern)

### File List

**Backend:**
- `packages/db/prisma/schema.prisma` — Added audio fields to Exercise model, audioSectionIndex to QuestionSection model
- `packages/types/src/exercises.ts` — Added PlaybackModeSchema, AudioSectionSchema, audio fields to Exercise/Create/Update/Autosave schemas, audioSectionIndex to QuestionSection schemas
- `packages/types/src/exercises.test.ts` — Added tests for PlaybackModeSchema, AudioSectionSchema, audioSectionIndex
- `apps/backend/src/modules/exercises/exercises.service.ts` — Added uploadAudio(), deleteAudio(), extended updateDraftExercise() and createExercise() with audio fields
- `apps/backend/src/modules/exercises/exercises.service.test.ts` — Added uploadAudio and deleteAudio unit tests
- `apps/backend/src/modules/exercises/exercises.controller.ts` — Added uploadAudio(), deleteAudio() controller methods
- `apps/backend/src/modules/exercises/exercises.routes.ts` — Added POST /:exerciseId/audio and DELETE /:exerciseId/audio routes
- `apps/backend/src/modules/exercises/sections.service.ts` — Added audioSectionIndex passthrough in createSection() and updateSection()

**Frontend:**
- `apps/webapp/src/features/exercises/hooks/use-audio-upload.ts` — NEW: useAudioUpload and useAudioDelete mutation hooks
- `apps/webapp/src/features/exercises/components/AudioUploadEditor.tsx` — NEW: Audio file upload with drag-drop, preview, remove
- `apps/webapp/src/features/exercises/components/AudioSectionMarkers.tsx` — NEW: Section timestamp editor with validation
- `apps/webapp/src/features/exercises/components/PlaybackModeSettings.tsx` — NEW: Test/Practice mode radio selector
- `apps/webapp/src/features/exercises/components/PassageEditor.tsx` — Added optional label and placeholder props
- `apps/webapp/src/features/exercises/components/ExerciseEditor.tsx` — Integrated audio components for LISTENING skill
- `apps/webapp/src/features/exercises/components/QuestionSectionEditor.tsx` — Widened onUpdateSection callback, added audioSections prop, added audio section linking dropdown
- `apps/webapp/src/features/exercises/components/audio-components.test.tsx` — Tests for PlaybackModeSettings, AudioSectionMarkers, AudioUploadEditor

**Other:**
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated OpenAPI schema sync
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Sprint tracking update
