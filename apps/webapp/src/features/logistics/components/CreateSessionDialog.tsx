import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, setHours, setMinutes } from "date-fns";
import { useAuth } from "@/features/auth/hooks/useAuth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { toast } from "sonner";
import { Plus, CalendarIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { Class, CreateClassSessionInput, Suggestion } from "@workspace/types";
import { useConflictCheck } from "../hooks/use-conflict-check";
import { ConflictWarningBanner } from "./ConflictWarningBanner";

const createSessionSchema = z.object({
  classId: z.string().min(1, "Please select a class"),
  date: z.date({ required_error: "Please select a date" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  roomName: z.string().optional(),
});

type CreateSessionFormValues = z.infer<typeof createSessionSchema>;

interface CreateSessionDialogProps {
  classes: Class[];
  onCreateSession: (input: CreateClassSessionInput) => Promise<unknown>;
  isCreating: boolean;
}

export function CreateSessionDialog({
  classes,
  onCreateSession,
  isCreating,
}: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [forceSubmit, setForceSubmit] = useState(false);
  const { user } = useAuth();

  // Track if we have valid form data to avoid premature conflict clearing
  const hasValidFormData = useRef(false);

  // Check if user can force-save conflicts
  const canForceSave = user?.role === "OWNER" || user?.role === "ADMIN";

  const form = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      classId: "",
      startTime: "09:00",
      endTime: "10:00",
      roomName: "",
    },
  });

  // Conflict checking
  const {
    hasConflicts,
    roomConflicts,
    teacherConflicts,
    suggestions,
    checkConflicts,
    clearConflicts,
    isChecking,
  } = useConflictCheck();

  // Watch form values for debounced conflict checking
  const watchedValues = useWatch({
    control: form.control,
  });

  // Check for conflicts when form values change
  useEffect(() => {
    const { classId, date, startTime, endTime, roomName } = watchedValues;

    // Only check if we have enough data
    if (!classId || !date || !startTime || !endTime) {
      hasValidFormData.current = false;
      // Don't clear immediately - only clear if we previously had valid data
      // This prevents flickering during rapid field changes
      return;
    }

    // Parse times
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startDateTime = setMinutes(setHours(date, startHour), startMin);
    const endDateTime = setMinutes(setHours(date, endHour), endMin);

    // Only check if end is after start
    if (endDateTime <= startDateTime) {
      hasValidFormData.current = false;
      return;
    }

    hasValidFormData.current = true;

    // Debounced conflict check
    checkConflicts({
      classId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      roomName: roomName || undefined,
    });
  }, [watchedValues, checkConflicts]);

  // Handle applying a suggestion
  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === "time" && suggestion.startTime && suggestion.endTime) {
      const start = new Date(suggestion.startTime);
      const end = new Date(suggestion.endTime);
      form.setValue(
        "startTime",
        `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`,
      );
      form.setValue(
        "endTime",
        `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`,
      );
    } else if (suggestion.type === "room") {
      form.setValue("roomName", suggestion.value);
    }
  };

  // Handle force save (submit despite conflicts)
  const handleForceSave = () => {
    setForceSubmit(true);
    form.handleSubmit(onSubmit)();
  };

  async function onSubmit(values: CreateSessionFormValues) {
    try {
      // Parse time strings and combine with date
      const [startHour, startMin] = values.startTime.split(":").map(Number);
      const [endHour, endMin] = values.endTime.split(":").map(Number);

      const startTime = setMinutes(setHours(values.date, startHour), startMin);
      const endTime = setMinutes(setHours(values.date, endHour), endMin);

      // Validate end time is after start time
      if (endTime <= startTime) {
        form.setError("endTime", { message: "End time must be after start time" });
        return;
      }

      // Block submission with conflicts unless force-saving (admins only)
      if (hasConflicts && !forceSubmit) {
        if (!canForceSave) {
          toast.error("Please resolve scheduling conflicts before creating the session");
          return;
        }
        // For admins, show a warning but allow them to use Force Save button
        toast.warning("Scheduling conflicts detected. Use 'Force Save' to override.");
        return;
      }

      await onCreateSession({
        classId: values.classId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        roomName: values.roomName || undefined,
      });

      toast.success("Session created successfully");
      setOpen(false);
      form.reset();
      clearConflicts();
      setForceSubmit(false);
    } catch {
      toast.error("Failed to create session");
      setForceSubmit(false);
    }
  }

  // Generate time options (every 30 minutes from 6 AM to 10 PM)
  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (const min of [0, 30]) {
      if (hour === 22 && min === 30) continue; // Skip 22:30
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const label = format(setMinutes(setHours(new Date(), hour), min), "h:mm a");
      timeOptions.push({ value: time, label });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>
            Schedule a new class session manually.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                          {cls.course && (
                            <span className="text-muted-foreground ml-2">
                              ({cls.course.name})
                            </span>
                          )}
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="roomName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Room 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflict Warning Banner */}
            {hasConflicts && (
              <ConflictWarningBanner
                roomConflicts={roomConflicts}
                teacherConflicts={teacherConflicts}
                suggestions={suggestions}
                onApplySuggestion={handleApplySuggestion}
                onForceSave={handleForceSave}
                isForcing={isCreating && forceSubmit}
              />
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isCreating || isChecking}>
                {isCreating ? "Creating..." : isChecking ? "Checking..." : "Create Session"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
