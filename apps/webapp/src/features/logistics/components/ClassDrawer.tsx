import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateClassSchema,
  type Class,
  type CreateClassInput,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useClasses, useCourses } from "../hooks/use-logistics";

interface ClassDrawerProps {
  cls?: Class | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: string;
}

export function ClassDrawer({
  cls,
  open,
  onOpenChange,
  centerId,
}: ClassDrawerProps) {
  const isEditing = !!cls;
  const { createClass, updateClass } = useClasses(centerId);
  const { courses } = useCourses(centerId);

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(CreateClassSchema),
    defaultValues: {
      name: "",
      courseId: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (cls) {
        form.reset({
          name: cls.name,
          courseId: cls.courseId,
          teacherId: cls.teacherId || undefined,
        });
      } else {
        form.reset({
          name: "",
          courseId: "",
        });
      }
    }
  }, [open, cls, form]);

  const onSubmit = async (values: CreateClassInput) => {
    try {
      if (isEditing && cls) {
        await updateClass({ id: cls.id, input: values });
        toast.success("Class updated successfully");
      } else {
        await createClass(values);
        toast.success("Class created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save class");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && form.formState.isDirty) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to close this drawer?",
        )
      ) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Edit Class" : "Create New Class"}
          </SheetTitle>
          <SheetDescription>
            Define the class name and link it to a course.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 p-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Class 10A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Create Class"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
