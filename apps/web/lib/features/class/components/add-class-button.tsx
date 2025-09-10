import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useCreateClass } from "../hooks/use-create-class";

const createClassFormInputSchema = z.object({
  centerId: z.string().nonoptional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  classMembers: z.array(z.string()),
});

export type CreateClassFormInput = z.infer<typeof createClassFormInputSchema>;

interface AddClassButtonProps {
  centerId: string;
}

function AddClassButton({ centerId }: AddClassButtonProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateClassFormInput>({
    resolver: zodResolver(createClassFormInputSchema),
    defaultValues: {
      centerId,
      name: "",
      description: "",
      classMembers: [],
    },
  });

  const { mutate, isPending } = useCreateClass();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Add new class</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new class</DialogTitle>
            <DialogDescription>Create a new class</DialogDescription>
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
                  "Create Class"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { AddClassButton };
