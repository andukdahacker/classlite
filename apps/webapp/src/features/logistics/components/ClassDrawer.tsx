import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateClassSchema,
  type Class,
  type CreateClassInput,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
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
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { addWeeks, startOfWeek } from "date-fns";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useClasses, useCourses } from "../hooks/use-logistics";
import { useRooms } from "../hooks/use-rooms";
import { useSessions } from "../hooks/use-sessions";
import { ScheduleManager } from "./ScheduleManager";

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
  const { rooms } = useRooms(centerId);
  const { generateSessions } = useSessions(centerId);
  const [roomComboOpen, setRoomComboOpen] = useState(false);

  // Callback to auto-generate sessions when a schedule is created
  const handleScheduleCreated = useCallback(async () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const fourWeeksLater = addWeeks(weekStart, 4);

    await generateSessions({
      startDate: weekStart.toISOString(),
      endDate: fourWeeksLater.toISOString(),
      classId: cls?.id,
    });
  }, [generateSessions, cls?.id]);

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(CreateClassSchema),
    defaultValues: {
      name: "",
      courseId: "",
      defaultRoomName: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (cls) {
        form.reset({
          name: cls.name,
          courseId: cls.courseId,
          teacherId: cls.teacherId || undefined,
          defaultRoomName: cls.defaultRoomName || "",
        });
      } else {
        form.reset({
          name: "",
          courseId: "",
          defaultRoomName: "",
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
    } catch {
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

        <div className="flex flex-col h-full overflow-y-auto">
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

              <FormField
                control={form.control}
                name="defaultRoomName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Default Room (Optional)</FormLabel>
                    <Popover open={roomComboOpen} onOpenChange={setRoomComboOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Select or type room..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search rooms..."
                            onValueChange={(val) => field.onChange(val)}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {field.value ? `Use "${field.value}"` : "No rooms found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {rooms.map((room) => (
                                <CommandItem
                                  key={room.id}
                                  value={room.name}
                                  onSelect={() => {
                                    field.onChange(room.name);
                                    setRoomComboOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === room.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {room.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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

          {/* Schedule Manager - outside the form to avoid nested forms */}
          {isEditing && cls && (
            <div className="px-6 pb-6">
              <Separator className="mb-4" />
              <ScheduleManager
                classId={cls.id}
                centerId={centerId}
                onScheduleCreated={handleScheduleCreated}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
