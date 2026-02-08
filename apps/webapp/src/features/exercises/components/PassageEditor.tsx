import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";

interface PassageEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function PassageEditor({ value, onChange, label = "Reading Passage" }: PassageEditorProps) {
  // Split into paragraphs for lettering display
  const paragraphs = value
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="passage-editor">{label}</Label>
        <p className="text-sm text-muted-foreground">
          Separate paragraphs with blank lines. Paragraph labels (A, B, C...)
          will be shown automatically.
        </p>
      </div>
      <Textarea
        id="passage-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the reading passage here. Use blank lines to separate paragraphs..."
        className="min-h-[300px] font-serif"
      />
      {paragraphs.length > 0 && (
        <div className="rounded-md border p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Preview ({paragraphs.length} paragraph
            {paragraphs.length !== 1 ? "s" : ""})
          </p>
          {paragraphs.map((para, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="font-bold text-primary min-w-[1.5rem] text-right">
                {String.fromCharCode(65 + idx)}
              </span>
              <p className="text-sm leading-relaxed">{para.trim()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
