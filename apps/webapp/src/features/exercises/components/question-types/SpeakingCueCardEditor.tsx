import { useCallback, useMemo } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface SpeakingCueCardEditorProps {
  options: { topic: string; bulletPoints: string[] } | null;
  onChange: (options: unknown, correctAnswer: unknown) => void;
}

export function SpeakingCueCardEditor({
  options,
  onChange,
}: SpeakingCueCardEditorProps) {
  const topic = options?.topic ?? "";
  const bulletPoints = useMemo(() => options?.bulletPoints ?? [""], [options?.bulletPoints]);

  const handleTopicChange = useCallback(
    (value: string) => {
      onChange({ topic: value, bulletPoints }, null);
    },
    [bulletPoints, onChange],
  );

  const handleBulletChange = useCallback(
    (index: number, value: string) => {
      const updated = [...bulletPoints];
      updated[index] = value;
      onChange({ topic, bulletPoints: updated }, null);
    },
    [topic, bulletPoints, onChange],
  );

  const handleAddBullet = useCallback(() => {
    if (bulletPoints.length >= 6) return;
    onChange({ topic, bulletPoints: [...bulletPoints, ""] }, null);
  }, [topic, bulletPoints, onChange]);

  const handleRemoveBullet = useCallback(
    (index: number) => {
      if (bulletPoints.length <= 1) return;
      const updated = bulletPoints.filter((_, i) => i !== index);
      onChange({ topic, bulletPoints: updated }, null);
    },
    [topic, bulletPoints, onChange],
  );

  const handleMoveBullet = useCallback(
    (index: number, direction: "up" | "down") => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= bulletPoints.length) return;
      const updated = [...bulletPoints];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      onChange({ topic, bulletPoints: updated }, null);
    },
    [topic, bulletPoints, onChange],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cue-card-topic">Cue Card Topic</Label>
        <Input
          id="cue-card-topic"
          value={topic}
          onChange={(e) => handleTopicChange(e.target.value)}
          placeholder="Describe a time when you helped someone..."
        />
      </div>

      <div className="space-y-2">
        <Label>Bullet Points (1-6)</Label>
        <p className="text-xs text-muted-foreground">
          Add guiding points for the student to address in their response.
        </p>
        <div className="space-y-2">
          {bulletPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex flex-col shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => handleMoveBullet(index, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => handleMoveBullet(index, "down")}
                  disabled={index === bulletPoints.length - 1}
                >
                  <ChevronDown className="size-3" />
                </Button>
              </div>
              <Input
                value={point}
                onChange={(e) => handleBulletChange(index, e.target.value)}
                placeholder={`Bullet point ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveBullet(index)}
                disabled={bulletPoints.length <= 1}
                className="shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        {bulletPoints.length < 6 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddBullet}
          >
            <Plus className="mr-1 size-4" />
            Add Bullet Point
          </Button>
        )}
      </div>
    </div>
  );
}
