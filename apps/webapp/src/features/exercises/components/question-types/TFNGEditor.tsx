import type { IeltsQuestionType } from "@workspace/types";
import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";

interface TFNGEditorProps {
  sectionType: IeltsQuestionType;
  correctAnswer: { answer: string } | null;
  onChange: (options: null, correctAnswer: { answer: string }) => void;
  questionId?: string;
}

const TFNG_OPTIONS = ["TRUE", "FALSE", "NOT_GIVEN"] as const;
const YNNG_OPTIONS = ["YES", "NO", "NOT_GIVEN"] as const;

const DISPLAY_LABELS: Record<string, string> = {
  TRUE: "True",
  FALSE: "False",
  NOT_GIVEN: "Not Given",
  YES: "Yes",
  NO: "No",
};

export function TFNGEditor({
  sectionType,
  correctAnswer,
  onChange,
  questionId = "default",
}: TFNGEditorProps) {
  const isYNNG = sectionType === "R4_YNNG";
  const choices = isYNNG ? YNNG_OPTIONS : TFNG_OPTIONS;
  const selected = correctAnswer?.answer ?? "";
  const idPrefix = `tfng-${questionId}`;

  return (
    <div className="space-y-2">
      <Label className="text-xs">Correct Answer</Label>
      <RadioGroup
        value={selected}
        onValueChange={(val) => onChange(null, { answer: val })}
        className="flex gap-4"
      >
        {choices.map((choice) => (
          <div key={choice} className="flex items-center gap-1.5">
            <RadioGroupItem
              value={choice}
              id={`${idPrefix}-${choice}`}
              aria-label={DISPLAY_LABELS[choice]}
            />
            <Label htmlFor={`${idPrefix}-${choice}`} className="text-sm cursor-pointer">
              {DISPLAY_LABELS[choice]}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
