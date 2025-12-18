"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Class } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Edit2Icon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v4";
import useUpdateClass from "../hooks/use-update-class";

interface UpdateClassDialogProps {
  klass: Class;
}

export const updateClassInputSchema = z.object({
  classId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
});

export type UpdateClassFormInput = z.infer<typeof updateClassInputSchema>;

function UpdateClassDialog({ klass }: UpdateClassDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateClassFormInput>({
    resolver: zodResolver(updateClassInputSchema),
    defaultValues: {
      classId: klass.id,
      name: klass.name,
      description: klass.description ?? "",
    },
  });

  const { mutate, isPending } = useUpdateClass();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Edit2Icon />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit class details</DialogTitle>
            <DialogDescription>Edit class info</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              className="flex flex-col gap-4 max-w-md items-center"
              onSubmit={form.handleSubmit((values) => mutate(values))}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Class name</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} required rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { UpdateClassDialog };
