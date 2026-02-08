import { useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Plus, X } from "lucide-react";

interface AudioSection {
  label: string;
  startTime: number;
  endTime: number;
}

function secondsToTimeStr(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function timeStrToSeconds(timeStr: string): number | null {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
    return null;
  }
  return mins * 60 + secs;
}

function validateSections(
  sections: AudioSection[],
  audioDuration: number | null,
): string[] {
  const errors: string[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.endTime <= s.startTime) {
      errors.push(`Section ${i + 1}: end time must be after start time`);
    }
    if (audioDuration != null && s.endTime > audioDuration) {
      errors.push(`Section ${i + 1}: end time exceeds audio duration`);
    }
    if (i > 0) {
      const prev = sections[i - 1];
      if (s.startTime < prev.endTime) {
        errors.push(
          `Section ${i + 1}: overlaps with Section ${i}`,
        );
      }
    }
  }
  return errors;
}

interface AudioSectionMarkersProps {
  sections: AudioSection[];
  audioDuration: number | null | undefined;
  onSectionsChange: (sections: AudioSection[]) => void;
}

export function AudioSectionMarkers({
  sections,
  audioDuration,
  onSectionsChange,
}: AudioSectionMarkersProps) {
  const errors = validateSections(sections, audioDuration ?? null);

  const handleAddSection = useCallback(() => {
    const lastEnd =
      sections.length > 0 ? sections[sections.length - 1].endTime : 0;
    const newSection: AudioSection = {
      label: `Section ${sections.length + 1}`,
      startTime: lastEnd,
      endTime: lastEnd + 60,
    };
    onSectionsChange([...sections, newSection]);
  }, [sections, onSectionsChange]);

  const handleRemoveSection = useCallback(
    (index: number) => {
      onSectionsChange(sections.filter((_, i) => i !== index));
    },
    [sections, onSectionsChange],
  );

  const handleFieldChange = useCallback(
    (index: number, field: keyof AudioSection, value: string) => {
      const updated = [...sections];
      if (field === "label") {
        updated[index] = { ...updated[index], label: value };
      } else {
        const seconds = timeStrToSeconds(value);
        if (seconds !== null) {
          updated[index] = { ...updated[index], [field]: seconds };
        }
      }
      onSectionsChange(updated);
    },
    [sections, onSectionsChange],
  );

  if (audioDuration == null || audioDuration <= 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label>Audio Sections</Label>

      {sections.length > 0 && (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={section.label}
                onBlur={(e) =>
                  handleFieldChange(index, "label", e.target.value)
                }
                onChange={(e) =>
                  handleFieldChange(index, "label", e.target.value)
                }
                placeholder="Label"
                className="w-32"
              />
              <Input
                defaultValue={secondsToTimeStr(section.startTime)}
                onBlur={(e) =>
                  handleFieldChange(index, "startTime", e.target.value)
                }
                placeholder="0:00"
                className="w-20 text-center"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                defaultValue={secondsToTimeStr(section.endTime)}
                onBlur={(e) =>
                  handleFieldChange(index, "endTime", e.target.value)
                }
                placeholder="0:00"
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSection(index)}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddSection}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>

      <p className="text-xs text-muted-foreground">
        Audio duration: {secondsToTimeStr(audioDuration)}. Define sections to
        link question groups to specific parts of the audio.
      </p>
    </div>
  );
}
