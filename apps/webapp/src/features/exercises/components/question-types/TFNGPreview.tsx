import type { IeltsQuestionType } from "@workspace/types";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Label } from "@workspace/ui/components/label";

interface TFNGPreviewProps {
  sectionType: IeltsQuestionType;
  questionText: string;
  questionIndex: number;
}

const TFNG_LABELS = ["True", "False", "Not Given"];
const YNNG_LABELS = ["Yes", "No", "Not Given"];

export function TFNGPreview({
  sectionType,
  questionText,
  questionIndex,
}: TFNGPreviewProps) {
  const labels = sectionType === "R4_YNNG" ? YNNG_LABELS : TFNG_LABELS;

  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium">{questionIndex + 1}.</span> {questionText}
      </p>
      <RadioGroup disabled className="flex gap-4 pl-4">
        {labels.map((label) => (
          <div key={label} className="flex items-center gap-1.5">
            <RadioGroupItem value={label} disabled />
            <Label className="text-sm text-muted-foreground">{label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
