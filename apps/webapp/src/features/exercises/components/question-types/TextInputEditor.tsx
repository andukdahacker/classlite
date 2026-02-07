import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TextInputEditorProps {
  correctAnswer: {
    answer: string;
    acceptedVariants: string[];
    caseSensitive: boolean;
  } | null;
  wordLimit: number | null;
  onChange: (
    options: null,
    correctAnswer: {
      answer: string;
      acceptedVariants: string[];
      caseSensitive: boolean;
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
  const caseSensitive = correctAnswer?.caseSensitive ?? false;

  const [localWordLimit, setLocalWordLimit] = useState(wordLimit);
  const [newVariant, setNewVariant] = useState("");

  useEffect(() => {
    setLocalWordLimit(wordLimit);
  }, [wordLimit]);

  const update = (
    newAnswer: string,
    newVariants: string[],
    newCaseSensitive: boolean,
    newWordLimit: number | null,
  ) => {
    onChange(
      null,
      {
        answer: newAnswer,
        acceptedVariants: newVariants,
        caseSensitive: newCaseSensitive,
      },
      newWordLimit,
    );
  };

  const addVariant = () => {
    if (!newVariant.trim()) return;
    update(answer, [...variants, newVariant.trim()], caseSensitive, wordLimit);
    setNewVariant("");
  };

  const removeVariant = (index: number) => {
    update(
      answer,
      variants.filter((_, i) => i !== index),
      caseSensitive,
      wordLimit,
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Correct Answer</Label>
        <Input
          defaultValue={answer}
          onChange={(e) =>
            update(e.target.value, variants, caseSensitive, wordLimit)
          }
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
              update(answer, variants, caseSensitive, val);
            }}
            placeholder="—"
            className="w-20 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="case-sensitive"
            checked={caseSensitive}
            onCheckedChange={(checked) =>
              update(answer, variants, checked === true, wordLimit)
            }
          />
          <Label htmlFor="case-sensitive" className="text-xs cursor-pointer">
            Case Sensitive
          </Label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Accepted Variants</Label>
        <div className="flex flex-wrap gap-1">
          {variants.map((v, i) => (
            <Badge key={i} variant="secondary" className="gap-1 text-xs">
              {v}
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="hover:text-destructive"
                aria-label={`Remove variant ${v}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newVariant}
            onChange={(e) => setNewVariant(e.target.value)}
            placeholder="Add accepted variant..."
            className="flex-1 h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVariant();
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addVariant}
            disabled={!newVariant.trim()}
          >
            <Plus className="mr-1 size-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
