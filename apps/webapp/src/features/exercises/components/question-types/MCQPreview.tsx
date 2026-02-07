import type { IeltsQuestionType } from "@workspace/types";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";

interface MCQPreviewProps {
  sectionType: IeltsQuestionType;
  questionText: string;
  questionIndex: number;
  options: { items: { label: string; text: string }[]; maxSelections?: number } | null;
}

export function MCQPreview({
  sectionType,
  questionText,
  questionIndex,
  options,
}: MCQPreviewProps) {
  const isMulti = sectionType === "R2_MCQ_MULTI";
  const items = options?.items ?? [];
  const maxSelections = options?.maxSelections;

  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium">{questionIndex + 1}.</span> {questionText}
      </p>
      {isMulti && maxSelections && (
        <p className="text-xs text-muted-foreground italic">
          Choose {maxSelections} answer{maxSelections > 1 ? "s" : ""}
        </p>
      )}
      {isMulti ? (
        <div className="space-y-1.5 pl-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <Checkbox disabled />
              <Label className="text-sm text-muted-foreground">
                {item.label}. {item.text}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <RadioGroup disabled className="space-y-1.5 pl-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <RadioGroupItem value={item.label} disabled />
              <Label className="text-sm text-muted-foreground">
                {item.label}. {item.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
