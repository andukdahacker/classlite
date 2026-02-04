import client from "@/core/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AttendanceStatus, SessionAttendanceResponse } from "@workspace/types";

/**
 * Extract error message from API error response
 */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function useSessionAttendance(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-attendance", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await client.GET(
        "/api/v1/logistics/sessions/{sessionId}/attendance",
        { params: { path: { sessionId } } }
      );
      if (error) throw error;
      return data?.data as SessionAttendanceResponse;
    },
    enabled: !!sessionId,
  });
}

export function useMarkAttendance(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { studentId: string; status: AttendanceStatus }) => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      const { data, error } = await client.POST(
        "/api/v1/logistics/sessions/{sessionId}/attendance",
        {
          params: { path: { sessionId } },
          body: input,
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error, "Failed to mark attendance"));
      }
      return data?.data;
    },

    onMutate: async (newData) => {
      if (!sessionId) return { previousData: undefined };

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["session-attendance", sessionId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<SessionAttendanceResponse>([
        "session-attendance",
        sessionId,
      ]);

      // Optimistically update - use same format as server response (ISO string)
      if (previousData) {
        queryClient.setQueryData<SessionAttendanceResponse>(
          ["session-attendance", sessionId],
          {
            ...previousData,
            students: previousData.students.map((s) =>
              s.id === newData.studentId
                ? {
                    ...s,
                    attendance: {
                      status: newData.status,
                      markedAt: new Date().toISOString(),
                    },
                  }
                : s
            ),
          }
        );
      }

      return { previousData };
    },

    onError: (err, _variables, context) => {
      // Rollback on error
      if (sessionId && context?.previousData) {
        queryClient.setQueryData(
          ["session-attendance", sessionId],
          context.previousData
        );
      }

      // Show error toast
      toast.error(err instanceof Error ? err.message : "Failed to mark attendance");
    },

    onSuccess: () => {
      // Show subtle success feedback
      toast.success("Attendance updated", { duration: 1500 });
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["session-attendance", sessionId] });
      }
    },
  });
}

export function useBulkAttendance(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: "PRESENT" | "ABSENT") => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      const { data, error } = await client.POST(
        "/api/v1/logistics/sessions/{sessionId}/attendance/bulk",
        {
          params: { path: { sessionId } },
          body: { status },
        }
      );
      if (error) {
        throw new Error(extractErrorMessage(error, "Bulk operation failed"));
      }
      return data?.data;
    },

    onSuccess: (data) => {
      const count = data?.count ?? 0;
      toast.success(`Marked ${count} students`);
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["session-attendance", sessionId] });
      }
    },

    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Bulk operation failed");
    },
  });
}

export function useStudentAttendanceStats(studentId: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["student-attendance-stats", studentId, startDate, endDate],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await client.GET(
        "/api/v1/logistics/students/{studentId}/attendance-stats",
        {
          params: {
            path: { studentId },
            query: { startDate, endDate },
          },
        }
      );
      if (error) throw error;
      return data?.data;
    },
    enabled: !!studentId,
  });
}

export function useStudentAttendanceHistory(studentId: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["student-attendance-history", studentId, startDate, endDate],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await client.GET(
        "/api/v1/logistics/students/{studentId}/attendance",
        {
          params: {
            path: { studentId },
            query: { startDate, endDate },
          },
        }
      );
      if (error) throw error;
      return data?.data ?? [];
    },
    enabled: !!studentId,
  });
}

export function useClassAttendanceStats(classId: string | null) {
  return useQuery({
    queryKey: ["class-attendance-stats", classId],
    queryFn: async () => {
      if (!classId) return null;
      const { data, error } = await client.GET(
        "/api/v1/logistics/classes/{classId}/attendance/stats",
        { params: { path: { classId } } }
      );
      if (error) throw error;
      return data?.data;
    },
    enabled: !!classId,
  });
}
