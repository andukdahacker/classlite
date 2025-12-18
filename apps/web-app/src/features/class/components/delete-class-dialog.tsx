"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useDeleteClass } from "../hooks/use-delete-class";

interface DeleteClassDialogProps {
  classId: string;
  onDeleted?: () => void;
}

function DeleteClassDialog({ classId, onDeleted }: DeleteClassDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useDeleteClass();
  const handleDelete = async () => {
    try {
      await mutateAsync(classId);
      setOpen(false);
      onDeleted?.();
    } catch (error) {}
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Class</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this class?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? <Loader2Icon className="animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DeleteClassDialog };
