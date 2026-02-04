import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
import { format, setHours, setMinutes } from "date-fns";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSchedules } from "../hooks/use-logistics";

const DAYS_OF_WEEK = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const scheduleSchema = z.object({
  dayOfWeek: z.string().min(1, "Please select a day"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  roomName: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleManagerProps {
  classId: string;
  centerId: string;
  onScheduleCreated?: () => Promise<void>;
}

export function ScheduleManager({ classId, centerId, onScheduleCreated }: ScheduleManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const {
    schedules,
    isLoading,
    createSchedule,
    deleteSchedule,
    isCreating,
    isDeleting,
  } = useSchedules(classId, centerId);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      dayOfWeek: "",
      startTime: "09:00",
      endTime: "10:00",
      roomName: "",
    },
  });

  async function onSubmit(values: ScheduleFormValues) {
    try {
      // Validate end time is after start time
      if (values.endTime <= values.startTime) {
        form.setError("endTime", {
          message: "End time must be after start time",
        });
        return;
      }

      await createSchedule({
        classId,
        dayOfWeek: parseInt(values.dayOfWeek),
        startTime: values.startTime,
        endTime: values.endTime,
        roomName: values.roomName || undefined,
      });

      // Auto-generate sessions for the next 4 weeks
      if (onScheduleCreated) {
        await onScheduleCreated();
      }

      toast.success("Schedule added and sessions generated");
      form.reset();
      setIsAdding(false);
    } catch {
      toast.error("Failed to add schedule");
    }
  }

  async function handleDelete(scheduleId: string) {
    if (!confirm("Delete this recurring schedule?")) return;
    try {
      await deleteSchedule(scheduleId);
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
  }

  // Generate time options
  const timeOptions: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (const min of [0, 30]) {
      if (hour === 22 && min === 30) continue;
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const label = format(
        setMinutes(setHours(new Date(), hour), min),
        "h:mm a",
      );
      timeOptions.push({ value: time, label });
    }
  }

  const getDayLabel = (dayOfWeek: number) => {
    return (
      DAYS_OF_WEEK.find((d) => d.value === String(dayOfWeek))?.label ??
      "Unknown"
    );
  };

  const formatTime = (time: string) => {
    const [hour, min] = time.split(":").map(Number);
    return format(setMinutes(setHours(new Date(), hour), min), "h:mm a");
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading schedules...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Recurring Schedule</h4>
          <p className="text-xs text-muted-foreground">
            Weekly patterns for automatic session generation
          </p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-1 size-3" />
            Add
          </Button>
        )}
      </div>

      {/* Existing schedules */}
      {schedules.length > 0 ? (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {getDayLabel(schedule.dayOfWeek)}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>
                    {formatTime(schedule.startTime)} -{" "}
                    {formatTime(schedule.endTime)}
                  </span>
                </div>
                {schedule.roomName && (
                  <span className="text-sm text-muted-foreground">
                    ({schedule.roomName})
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(schedule.id)}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
            No recurring schedules. Add one to enable &quot;Generate Sessions&quot;.
          </div>
        )
      )}

      {/* Add schedule form */}
      {isAdding && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                        <FormLabel>End</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreating}>
                    {isCreating ? "Adding..." : "Add Schedule"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
