import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = async () => {
    if (confirmText !== "DELETE") return;
    await onConfirm();
    setConfirmText("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Your Account
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              This action will schedule your account for deletion. You will have{" "}
              <strong>7 days</strong> to cancel this request.
            </p>
            <p>After 7 days:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Your profile and data will be permanently deleted</li>
              <li>You will be removed from all classes and courses</li>
              <li>This action cannot be undone</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmText !== "DELETE" || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete My Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
