export const studentHealthKeys = {
  all: ["student-health"] as const,
  dashboard: (filters?: { classId?: string; search?: string }) =>
    [...studentHealthKeys.all, "dashboard", filters] as const,
  profile: (studentId: string) =>
    [...studentHealthKeys.all, "profile", studentId] as const,
};
