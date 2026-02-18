import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useInterventionPreview,
  useSendIntervention,
} from "../hooks/use-intervention";

interface InterventionComposeModalProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InterventionComposeModal({
  studentId,
  open,
  onOpenChange,
}: InterventionComposeModalProps) {
  const { preview, isLoading: previewLoading } = useInterventionPreview(
    open ? studentId : null,
  );
  const sendMutation = useSendIntervention(studentId);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateUsed, setTemplateUsed] = useState<
    "concern-attendance" | "concern-assignments" | "concern-general"
  >("concern-general");

  // Pre-fill from preview when it loads
  useEffect(() => {
    if (preview) {
      setTo(preview.recipientEmail ?? "");
      setSubject(preview.subject);
      setBody(preview.body);
      setTemplateUsed(preview.templateUsed);
    }
  }, [preview]);

  // Reset fields when modal closes
  useEffect(() => {
    if (!open) {
      setTo("");
      setSubject("");
      setBody("");
      setTemplateUsed("concern-general");
    }
  }, [open]);

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync({
        studentId,
        recipientEmail: to,
        subject,
        body,
        templateUsed,
      });
      toast.success("Intervention email queued");
      onOpenChange(false);
    } catch {
      toast.error("Failed to send intervention email");
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact Parent</DialogTitle>
        </DialogHeader>

        {previewLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !isEmailValid || !subject || !body}
          >
            {sendMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
