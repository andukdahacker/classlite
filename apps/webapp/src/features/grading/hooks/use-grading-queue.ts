import client from "@/core/client";
import { useQuery } from "@tanstack/react-query";
import { gradingKeys } from "./grading-keys";

interface GradingQueueFilters {
  classId?: string;
  assignmentId?: string;
  status?: "not_applicable" | "analyzing" | "ready" | "failed";
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
