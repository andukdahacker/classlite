import type { CommentVisibility, CreateTeacherComment, GradingQueueFilters, UpdateTeacherComment } from "@workspace/types";
import { GradingService } from "./grading.service.js";

function serializeDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Date) {
      (result as Record<string, unknown>)[key] = (result[key] as Date).toISOString();
    }
  }
  return result;
}

function serializeFeedback(feedback: Record<string, unknown>) {
  const serialized = serializeDates(feedback);
  if (Array.isArray(serialized.items)) {
    serialized.items = serialized.items.map((item: Record<string, unknown>) =>
      serializeDates(item),
    );
  }
  return serialized;
}

export class GradingController {
  constructor(private readonly service: GradingService) {}

  async getGradingQueue(
    user: { uid: string; centerId: string },
    filters: GradingQueueFilters,
  ) {
    const result = await this.service.getGradingQueue(
      user.centerId,
      user.uid,
      filters,
    );
    return { data: result, message: "Grading queue retrieved" };
  }

  async getSubmissionDetail(
    submissionId: string,
    user: { uid: string; centerId: string },
  ) {
    const result = await this.service.getAnalysisResults(
      user.centerId,
      submissionId,
      user.uid,
    );

    const serializedSubmission = JSON.parse(JSON.stringify(result.submission));

    return {
      data: {
        submission: serializedSubmission,
        analysisStatus: result.analysisStatus,
        feedback: result.feedback
          ? serializeFeedback(result.feedback as unknown as Record<string, unknown>)
          : null,
        teacherComments: result.teacherComments.map((c) =>
          serializeDates(c as unknown as Record<string, unknown>),
        ),
      },
      message: "Submission detail retrieved",
    };
  }

  async getSubmissionFeedback(
    submissionId: string,
    user: { uid: string; centerId: string },
  ) {
    const feedback = await this.service.getSubmissionFeedback(
      user.centerId,
      submissionId,
      user.uid,
    );
    return {
      data: serializeFeedback(feedback as unknown as Record<string, unknown>),
      message: "Feedback retrieved",
    };
  }

  async createComment(
    submissionId: string,
    user: { uid: string; centerId: string },
    body: CreateTeacherComment,
  ) {
    const comment = await this.service.createComment(
      user.centerId,
      submissionId,
      user.uid,
      body,
    );
    return {
      data: serializeDates(comment as unknown as Record<string, unknown>),
      message: "Comment created",
    };
  }

  async getComments(
    submissionId: string,
    user: { uid: string; centerId: string },
    visibility?: CommentVisibility,
  ) {
    const comments = await this.service.getComments(
      user.centerId,
      submissionId,
      user.uid,
      visibility,
    );
    return {
      data: comments.map((c) =>
        serializeDates(c as unknown as Record<string, unknown>),
      ),
      message: "Comments retrieved",
    };
  }

  async updateComment(
    submissionId: string,
    commentId: string,
    user: { uid: string; centerId: string },
    body: UpdateTeacherComment,
  ) {
    const comment = await this.service.updateComment(
      user.centerId,
      submissionId,
      commentId,
      user.uid,
      body,
    );
    return {
      data: serializeDates(comment as unknown as Record<string, unknown>),
      message: "Comment updated",
    };
  }

  async deleteComment(
    submissionId: string,
    commentId: string,
    user: { uid: string; centerId: string },
  ) {
    await this.service.deleteComment(
      user.centerId,
      submissionId,
      commentId,
      user.uid,
    );
    return { data: null, message: "Comment deleted" };
  }

  async triggerAnalysis(
    submissionId: string,
    user: { uid: string; centerId: string },
  ) {
    const job = await this.service.retriggerAnalysis(
      user.centerId,
      submissionId,
      user.uid,
    );
    return {
      data: serializeDates(job as unknown as Record<string, unknown>),
      message: "AI analysis triggered",
    };
  }
}
