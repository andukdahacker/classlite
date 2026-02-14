export const submissionKeys = {
  all: ["submissions"] as const,
  detail: (id: string) => [...submissionKeys.all, "detail", id] as const,
  byAssignment: (assignmentId: string) => [...submissionKeys.all, "assignment", assignmentId] as const,
};
