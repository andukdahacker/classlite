import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";

interface TextInputPreviewProps {
  questionText: string;
  questionIndex: number;
  wordLimit: number | null | undefined;
}

export function TextInputPreview({
  questionText,
  questionIndex,
  wordLimit,
}: TextInputPreviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-medium">{questionIndex + 1}.</span> {questionText}
      </p>
      <div className="flex items-center gap-2 pl-4">
        <Input
          disabled
          placeholder="Type your answer..."
          className="max-w-xs h-8 text-sm"
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
