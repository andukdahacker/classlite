import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface DiagramLabellingOptions {
  diagramUrl: string;
  labelPositions: string[];
  wordBank?: string[];
  wordLimit?: number;
}

interface DiagramLabellingPreviewProps {
  questionIndex: number;
  options: DiagramLabellingOptions | null;
}

export function DiagramLabellingPreview({
  questionIndex,
  options,
}: DiagramLabellingPreviewProps) {
  if (!options) {
    return (
      <div className="pl-4 text-sm text-muted-foreground italic">
        {questionIndex + 1}. No diagram configured.
      </div>
    );
  }

  const { diagramUrl, labelPositions, wordBank, wordLimit = 2 } = options;
  const useWordBank = Array.isArray(wordBank) && wordBank.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{questionIndex + 1}.</p>

      {/* Diagram image */}
      {diagramUrl ? (
        <div className="pl-4 max-w-[400px]">
          <img
            src={diagramUrl}
            alt="Diagram"
            className="max-w-full h-auto rounded border"
          />
        </div>
      ) : (
        <p className="pl-4 text-sm text-muted-foreground italic">
          No diagram uploaded.
        </p>
      )}

      {/* Label list below image */}
      <div className="pl-4 space-y-1">
        {labelPositions.map((pos, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm font-medium min-w-[2rem]">{i + 1}.</span>
            <span className="text-xs text-muted-foreground min-w-[8rem]">
              {pos}
            </span>
            {useWordBank ? (
              // H1 fix: use String(index) for SelectItem value to prevent Radix crashes on duplicates
              <Select disabled>
                <SelectTrigger className="h-7 text-xs w-[180px]">
                  <SelectValue placeholder="Select label..." />
                </SelectTrigger>
                <SelectContent>
                  {wordBank.map((word, wi) => (
                    <SelectItem key={wi} value={String(wi)}>
                      {word}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Input
                  disabled
                  placeholder="..."
                  className="h-6 w-24 text-xs"
                />
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                  {wordLimit}w
                </Badge>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Distractor badge */}
      {useWordBank && (
        <div className="pl-4">
          <Badge variant="secondary" className="text-xs">
            {wordBank.length} labels, {labelPositions.length} positions
            {wordBank.length > labelPositions.length && (
              <> ({wordBank.length - labelPositions.length} distractor{wordBank.length - labelPositions.length > 1 ? "s" : ""})</>
            )}
          </Badge>
        </div>
      )}
    </div>
  );
}
