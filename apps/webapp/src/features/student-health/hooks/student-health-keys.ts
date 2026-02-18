export const studentHealthKeys = {
  all: ["student-health"] as const,
  dashboard: (filters?: { classId?: string; search?: string }) =>
    [...studentHealthKeys.all, "dashboard", filters] as const,
  profile: (studentId: string) =>
    [...studentHealthKeys.all, "profile", studentId] as const,
  interventionHistory: (studentId: string) =>
    [...studentHealthKeys.all, "interventions", studentId] as const,
  interventionPreview: (studentId: string) =>
    [...studentHealthKeys.all, "interventions", studentId, "preview"] as const,
  teacherAtRiskWidget: () =>
    [...studentHealthKeys.all, "teacher-widget"] as const,
  flags: (studentId: string) =>
    [...studentHealthKeys.all, "flags", studentId] as const,
};
