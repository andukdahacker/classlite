import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Plus, Trash2, Upload, Image } from "lucide-react";
import { useRef, useState } from "react";
import { useDiagramUpload } from "../../hooks/use-diagram-upload";
import { AnswerVariantManager } from "./AnswerVariantManager";
import { toast } from "sonner";

interface DiagramLabellingOptions {
  diagramUrl: string;
  labelPositions: string[];
  wordBank?: string[];
  wordLimit: number;
}

interface StructuredLabel {
  answer: string;
  acceptedVariants: string[];
  strictWordOrder: boolean;
}

type LabelValue = string | StructuredLabel;

interface DiagramLabellingAnswer {
  labels: Record<string, LabelValue>;
}

interface DiagramLabellingEditorProps {
  options: DiagramLabellingOptions | null;
  correctAnswer: DiagramLabellingAnswer | null;
  exerciseId?: string;
  onChange: (
    options: DiagramLabellingOptions,
    correctAnswer: DiagramLabellingAnswer,
  ) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

export function DiagramLabellingEditor({
  options,
  correctAnswer,
  exerciseId,
  onChange,
}: DiagramLabellingEditorProps) {
  const diagramUrl = options?.diagramUrl ?? "";
  const labelPositions = options?.labelPositions ?? [];
  const wordBank = options?.wordBank;
  const wordLimit = options?.wordLimit ?? 2;
  const labels = correctAnswer?.labels ?? {};

  const [newWord, setNewWord] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useDiagramUpload();

  const useWordBank = Array.isArray(wordBank);

  const update = (
    newOptions: DiagramLabellingOptions,
    newLabels: Record<string, LabelValue>,
  ) => {
    onChange(newOptions, { labels: newLabels });
  };

  const buildOptions = (overrides: Partial<DiagramLabellingOptions>): DiagramLabellingOptions => ({
    diagramUrl,
    labelPositions,
    wordBank,
    wordLimit,
    ...overrides,
  });

  // --- Diagram upload ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only PNG, JPG, and SVG are allowed.");
      return;
    }

    if (!exerciseId) {
      toast.error("Save the exercise first before uploading a diagram.");
      return;
    }

    try {
      const url = await uploadMutation.mutateAsync({ exerciseId, file });
      update(buildOptions({ diagramUrl: url }), labels);
      toast.success("Diagram uploaded");
    } catch {
      toast.error("Failed to upload diagram");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDiagram = () => {
    update(buildOptions({ diagramUrl: "" }), labels);
  };

  // --- Label positions ---

  const addPosition = () => {
    const newPositions = [...labelPositions, `Position ${labelPositions.length + 1}`];
    update(buildOptions({ labelPositions: newPositions }), labels);
  };

  const removePosition = (index: number) => {
    const newPositions = labelPositions.filter((_, i) => i !== index);
    // Re-index labels
    const newLabels: Record<string, LabelValue> = {};
    for (const [key, val] of Object.entries(labels)) {
      const numKey = Number(key);
      if (numKey === index) continue;
      if (numKey > index) {
        newLabels[String(numKey - 1)] = val;
      } else {
        newLabels[key] = val;
      }
    }
    update(buildOptions({ labelPositions: newPositions }), newLabels);
  };

  const updatePosition = (index: number, value: string) => {
    const newPositions = [...labelPositions];
    newPositions[index] = value;
    update(buildOptions({ labelPositions: newPositions }), labels);
  };

  const updateLabel = (index: number, value: LabelValue) => {
    const newLabels = { ...labels, [String(index)]: value };
    update(buildOptions({}), newLabels);
  };

  /** Get the display string for a label value */
  const getLabelAnswer = (index: number): string => {
    const val = labels[String(index)];
    if (!val) return "";
    if (typeof val === "string") return val;
    return val.answer;
  };

  /** Get structured label, creating default if needed */
  const getStructuredLabel = (index: number): StructuredLabel => {
    const val = labels[String(index)];
    if (!val) return { answer: "", acceptedVariants: [], strictWordOrder: true };
    if (typeof val === "string") return { answer: val, acceptedVariants: [], strictWordOrder: true };
    return val;
  };

  // --- Word bank ---

  const toggleWordBank = (checked: boolean) => {
    if (checked) {
      update(buildOptions({ wordBank: [] }), labels);
    } else {
      // Convert string labels to structured format when disabling word bank
      const migratedLabels: Record<string, LabelValue> = {};
      for (const [key, val] of Object.entries(labels)) {
        if (typeof val === "string") {
          migratedLabels[key] = { answer: val, acceptedVariants: [], strictWordOrder: true };
        } else {
          migratedLabels[key] = val;
        }
      }
      update(buildOptions({ wordBank: undefined }), migratedLabels);
    }
  };

  const addWord = () => {
    const trimmed = newWord.trim();
    if (!trimmed || !wordBank) return;
    if (wordBank.includes(trimmed)) return;
    update(buildOptions({ wordBank: [...wordBank, trimmed] }), labels);
    setNewWord("");
  };

  const removeWord = (index: number) => {
    if (!wordBank) return;
    const newWordBank = wordBank.filter((_, i) => i !== index);
    update(buildOptions({ wordBank: newWordBank }), labels);
  };

  const distractorCount = useWordBank ? (wordBank?.length ?? 0) - labelPositions.length : 0;

  return (
    <div className="space-y-3">
      {/* Diagram image section */}
      <div className="space-y-1.5">
        <Label className="text-xs">Diagram Image</Label>
        {diagramUrl ? (
          <div className="space-y-2">
            <div className="border rounded p-2 max-w-[400px]">
              <img
                src={diagramUrl}
                alt="Diagram"
                className="max-w-full h-auto rounded"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={removeDiagram}
            >
              <Trash2 className="mr-1 size-3" />
              Remove Image
            </Button>
          </div>
        ) : (
          <div className="border border-dashed rounded p-4 flex flex-col items-center gap-2">
            <Image className="size-8 text-muted-foreground" />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="mr-1 size-3" />
              {uploadMutation.isPending ? "Uploading..." : "Upload Diagram"}
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Label positions + answer assignment */}
      <div className="space-y-1.5">
        <Label className="text-xs">Label Positions & Correct Labels</Label>
        <div className="space-y-2">
          {labelPositions.map((pos, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                  {i + 1}
                </Badge>
                <Input
                  defaultValue={pos}
                  onBlur={(e) => updatePosition(i, e.target.value)}
                  placeholder="Label description..."
                  className="flex-1 h-7 text-xs"
                />
                <Input
                  defaultValue={getLabelAnswer(i)}
                  onBlur={(e) => {
                    if (useWordBank) {
                      updateLabel(i, e.target.value);
                    } else {
                      const current = getStructuredLabel(i);
                      updateLabel(i, { ...current, answer: e.target.value });
                    }
                  }}
                  placeholder="Correct label..."
                  className="flex-1 h-7 text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => removePosition(i)}
                  aria-label="Remove position"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              {!useWordBank && (
                <div className="pl-8">
                  <AnswerVariantManager
                    variants={getStructuredLabel(i).acceptedVariants}
                    onVariantsChange={(newVariants) => {
                      const current = getStructuredLabel(i);
                      updateLabel(i, { ...current, acceptedVariants: newVariants });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={addPosition}
        >
          <Plus className="mr-1 size-3" />
          Add Position
        </Button>
      </div>

      {/* Word bank toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use-word-bank"
            checked={useWordBank}
            onCheckedChange={(checked) => toggleWordBank(checked === true)}
          />
          <Label htmlFor="use-word-bank" className="text-xs cursor-pointer">
            Use Word Bank
          </Label>
        </div>

        {useWordBank && (
          <div className="space-y-1.5 pl-6">
            <div className="flex flex-wrap gap-1">
              {(wordBank ?? []).map((word, i) => (
                <Badge key={i} variant="secondary" className="gap-1 text-xs">
                  {word}
                  <button
                    type="button"
                    onClick={() => removeWord(i)}
                    className="hover:text-destructive"
                    aria-label={`Remove word ${word}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Add a word to the bank..."
                className="flex-1 h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addWord();
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={addWord}
                disabled={!newWord.trim()}
              >
                <Plus className="mr-1 size-3" />
                Add
              </Button>
            </div>
            {distractorCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {wordBank?.length ?? 0} labels, {labelPositions.length} positions
                ({distractorCount} distractor{distractorCount > 1 ? "s" : ""})
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Word limit control */}
      {!useWordBank && (
        <div className="space-y-1.5">
          <Label className="text-xs">Word Limit</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={5}
              defaultValue={wordLimit}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= 5) {
                  update(buildOptions({ wordLimit: val }), labels);
                }
              }}
              className="w-20 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground">words</span>
          </div>
        </div>
      )}
    </div>
  );
}
