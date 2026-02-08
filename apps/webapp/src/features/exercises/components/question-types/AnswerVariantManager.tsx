import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Textarea } from "@workspace/ui/components/textarea";
import { ClipboardPaste, Plus, X } from "lucide-react";
import { useState } from "react";

interface AnswerVariantManagerProps {
  variants: string[];
  onVariantsChange: (variants: string[]) => void;
  disabled?: boolean;
}

function deduplicateAndSort(variants: string[]): string[] {
  return [...new Set(variants)].sort((a, b) => a.localeCompare(b));
}

export function AnswerVariantManager({
  variants,
  onVariantsChange,
  disabled = false,
}: AnswerVariantManagerProps) {
  const [newVariant, setNewVariant] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const addVariant = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || variants.includes(trimmed)) return;
    onVariantsChange(deduplicateAndSort([...variants, trimmed]));
  };

  const handleAddVariant = () => {
    addVariant(newVariant);
    setNewVariant("");
  };

  const handleRemoveVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index));
  };

  const handleBulkImport = () => {
    const parsed = bulkText
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (parsed.length === 0) return;
    onVariantsChange(deduplicateAndSort([...variants, ...parsed]));
    setBulkText("");
    setBulkOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Accepted Variants</Label>
        <Popover open={bulkOpen} onOpenChange={setBulkOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1"
              disabled={disabled}
            >
              <ClipboardPaste className="size-3" />
              Paste variants
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label className="text-xs">Paste comma-separated variants</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="e.g. 19, nineteen, Nineteen"
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkText("");
                    setBulkOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkImport}
                  disabled={!bulkText.trim()}
                >
                  Import
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-wrap gap-1">
        {variants.map((v, i) => (
          <Badge key={i} variant="secondary" className="gap-1 text-xs">
            {v}
            <button
              type="button"
              onClick={() => handleRemoveVariant(i)}
              className="hover:text-destructive"
              aria-label={`Remove variant ${v}`}
              disabled={disabled}
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
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddVariant();
            }
          }}
          onBlur={() => {
            if (newVariant.trim()) {
              handleAddVariant();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleAddVariant}
          disabled={disabled || !newVariant.trim()}
        >
          <Plus className="mr-1 size-3" />
          Add
        </Button>
      </div>
    </div>
  );
}
