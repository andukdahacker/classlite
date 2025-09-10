"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AddUserForm } from "./add-user-form";
function AddUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new user</DialogTitle>
          <DialogDescription>Let's create a new user</DialogDescription>
        </DialogHeader>
        <AddUserForm onCreateUser={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export { AddUserButton };
