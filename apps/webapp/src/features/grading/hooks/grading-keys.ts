export const gradingKeys = {
  all: ["grading"] as const,
  queue: (filters: object) =>
    [...gradingKeys.all, "queue", filters] as const,
  detail: (id: string) => [...gradingKeys.all, "detail", id] as const,
  feedback: (id: string) => [...gradingKeys.all, "feedback", id] as const,
  comments: (submissionId: string) =>
    [...gradingKeys.all, "comments", submissionId] as const,
  studentFeedback: (id: string) =>
    [...gradingKeys.all, "student-feedback", id] as const,
  submissionHistory: (id: string) =>
    [...gradingKeys.all, "submission-history", id] as const,
};
