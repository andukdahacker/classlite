import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useEffect, useState } from "react";
import { AnswerVariantManager } from "./AnswerVariantManager";

interface TextInputEditorProps {
  correctAnswer: {
    answer: string;
    acceptedVariants: string[];
    strictWordOrder: boolean;
  } | null;
  wordLimit: number | null;
  onChange: (
    options: null,
    correctAnswer: {
      answer: string;
      acceptedVariants: string[];
      strictWordOrder: boolean;
    },
    wordLimit: number | null,
  ) => void;
}

export function TextInputEditor({
  correctAnswer,
  wordLimit,
  onChange,
}: TextInputEditorProps) {
  const answer = correctAnswer?.answer ?? "";
  const variants = correctAnswer?.acceptedVariants ?? [];
  const strictWordOrder = correctAnswer?.strictWordOrder ?? true;

  const [localAnswer, setLocalAnswer] = useState(answer);
  const [localWordLimit, setLocalWordLimit] = useState(wordLimit);

  useEffect(() => {
    setLocalAnswer(answer);
  }, [answer]);

  useEffect(() => {
    setLocalWordLimit(wordLimit);
  }, [wordLimit]);

  const update = (
    newAnswer: string,
    newVariants: string[],
    newStrictWordOrder: boolean,
    newWordLimit: number | null,
  ) => {
    onChange(
      null,
      {
        answer: newAnswer,
        acceptedVariants: newVariants,
        strictWordOrder: newStrictWordOrder,
      },
      newWordLimit,
    );
  };

  const hasMultipleWords = localAnswer.trim().split(/\s+/).filter(Boolean).length >= 2;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Correct Answer</Label>
        <Input
          value={localAnswer}
          onChange={(e) => setLocalAnswer(e.target.value)}
          onBlur={() => {
            if (localAnswer !== answer) {
              update(localAnswer, variants, strictWordOrder, wordLimit);
            }
          }}
          placeholder="Enter the correct answer..."
          className="h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Word Limit</Label>
          <Input
            type="number"
            min={1}
            value={localWordLimit ?? ""}
            onChange={(e) => {
              const val = e.target.value
                ? Number(e.target.value)
                : null;
              setLocalWordLimit(val);
            }}
            onBlur={() => {
              if (localWordLimit !== wordLimit) {
                update(localAnswer, variants, strictWordOrder, localWordLimit);
              }
            }}
            placeholder="—"
            className="w-20 h-8 text-sm"
          />
        </div>
      </div>

      {hasMultipleWords && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="word-order-toggle"
            checked={!strictWordOrder}
            onCheckedChange={(checked) =>
              update(localAnswer, variants, checked !== true, wordLimit)
            }
          />
          <Label htmlFor="word-order-toggle" className="text-xs cursor-pointer">
            Allow any word order
          </Label>
          <span className="text-xs text-muted-foreground">
            (e.g. &quot;carbon dioxide&quot; also accepts &quot;dioxide carbon&quot;)
          </span>
        </div>
      )}

      <AnswerVariantManager
        variants={variants}
        onVariantsChange={(newVariants) =>
          update(localAnswer, newVariants, strictWordOrder, wordLimit)
        }
      />
    </div>
  );
}
