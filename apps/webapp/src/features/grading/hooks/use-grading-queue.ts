import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { gradingKeys } from "./grading-keys";

export interface GradingQueueFilters {
  classId?: string;
  assignmentId?: string;
  status?: "not_applicable" | "analyzing" | "ready" | "failed";
  gradingStatus?: "pending_ai" | "ready" | "in_progress" | "graded";
  sortBy?: "submittedAt" | "dueDate" | "studentName";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function useGradingQueue(filters: GradingQueueFilters = {}) {
  return useQuery({
    queryKey: gradingKeys.queue(filters),
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/grading/submissions",
        {
          params: { query: filters },
        },
      );
      if (error) throw error;
      return data;
    },
  });
}
