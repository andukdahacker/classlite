import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";

interface TextAnswerInputProps {
  questionText: string;
  questionIndex: number;
  wordLimit: number | null | undefined;
  value: { answer?: string } | null;
  onChange: (answer: unknown) => void;
}

export function TextAnswerInput({
  questionText,
  questionIndex,
  wordLimit,
  value,
  onChange,
}: TextAnswerInputProps) {
  const currentAnswer = (value as { answer?: string })?.answer ?? "";

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="font-medium">{questionIndex + 1}.</span> {questionText}
      </p>
      <div className="flex items-center gap-2">
        <Input
          value={currentAnswer}
          onChange={(e) => onChange({ answer: e.target.value })}
          placeholder="Type your answer..."
          className="min-h-[44px] text-sm"
        />
        {wordLimit && (
          <Badge variant="outline" className="text-xs shrink-0">
            Max {wordLimit} word{wordLimit > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  );
}
