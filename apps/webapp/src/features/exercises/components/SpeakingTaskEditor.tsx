import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Info } from "lucide-react";
import type { IeltsQuestionType } from "@workspace/types";

interface SpeakingTaskEditorProps {
  sectionType: IeltsQuestionType | null;
  speakingPrepTime: number | null;
  speakingTime: number | null;
  maxRecordingDuration: number | null;
  enableTranscription: boolean;
  onSpeakingPrepTimeChange: (value: number | null) => void;
  onSpeakingTimeChange: (value: number | null) => void;
  onMaxRecordingDurationChange: (value: number | null) => void;
  onEnableTranscriptionChange: (value: boolean) => void;
}

export function SpeakingTaskEditor({
  sectionType,
  speakingPrepTime,
  speakingTime,
  maxRecordingDuration,
  enableTranscription,
  onSpeakingPrepTimeChange,
  onSpeakingTimeChange,
  onMaxRecordingDurationChange,
  onEnableTranscriptionChange,
}: SpeakingTaskEditorProps) {
  const isCueCard = sectionType === "S2_PART2_CUE_CARD";

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Speaking Exercise Settings
      </h3>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Speaking exercises allow students to record audio responses. Recording
          playback and AI transcription are configured here.
        </p>
      </div>

      {/* S2 Cue Card Settings */}
      {isCueCard && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cue Card Timer Settings</Label>
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="speaking-prep-time"
                className="text-xs text-muted-foreground"
              >
                Preparation Time (seconds)
              </Label>
              <Input
                id="speaking-prep-time"
                type="number"
                value={speakingPrepTime ?? ""}
                onChange={(e) =>
                  onSpeakingPrepTimeChange(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                placeholder="60"
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="speaking-time"
                className="text-xs text-muted-foreground"
              >
                Speaking Time (seconds)
              </Label>
              <Input
                id="speaking-time"
                type="number"
                value={speakingTime ?? ""}
                onChange={(e) =>
                  onSpeakingTimeChange(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                placeholder="120"
                className="w-28"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recording Settings */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Recording Settings</Label>
        <div className="space-y-1">
          <Label
            htmlFor="max-recording-duration"
            className="text-xs text-muted-foreground"
          >
            Max Recording Duration per Question (seconds)
          </Label>
          <Input
            id="max-recording-duration"
            type="number"
            value={maxRecordingDuration ?? ""}
            onChange={(e) =>
              onMaxRecordingDurationChange(
                e.target.value ? parseInt(e.target.value, 10) : null,
              )
            }
            placeholder={isCueCard ? "120" : "60"}
            className="w-28"
          />
        </div>
      </div>

      {/* Transcription Toggle */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="enable-transcription"
          checked={enableTranscription}
          onCheckedChange={(checked) =>
            onEnableTranscriptionChange(checked === true)
          }
        />
        <div className="space-y-1">
          <Label
            htmlFor="enable-transcription"
            className="text-sm font-medium cursor-pointer"
          >
            Enable AI Transcription
          </Label>
          <p className="text-xs text-muted-foreground">
            Automatically transcribe student recordings for grading assistance.
            (Available when AI Grading is enabled)
          </p>
        </div>
      </div>
    </div>
  );
}
