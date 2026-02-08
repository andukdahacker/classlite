import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";

interface PlaybackModeSettingsProps {
  playbackMode: string | null | undefined;
  onPlaybackModeChange: (mode: "TEST_MODE" | "PRACTICE_MODE") => void;
}

export function PlaybackModeSettings({
  playbackMode,
  onPlaybackModeChange,
}: PlaybackModeSettingsProps) {
  return (
    <div className="space-y-2">
      <Label>Playback Mode</Label>
      <RadioGroup
        value={playbackMode ?? "PRACTICE_MODE"}
        onValueChange={(value) =>
          onPlaybackModeChange(value as "TEST_MODE" | "PRACTICE_MODE")
        }
        className="space-y-2"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="PRACTICE_MODE" id="practice-mode" />
          <div className="grid gap-0.5 leading-none">
            <Label htmlFor="practice-mode" className="cursor-pointer">
              Practice Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Unlimited replay with seek bar and speed control
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="TEST_MODE" id="test-mode" />
          <div className="grid gap-0.5 leading-none">
            <Label htmlFor="test-mode" className="cursor-pointer">
              Test Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Single play only. Audio plays once, then locks.
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
