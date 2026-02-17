import { PrismaClient, getTenantedClient } from "@workspace/db";
import type { AnalysisStatus, ApproveFeedbackItem, BulkApproveFeedbackItems, CommentVisibility, CreateTeacherComment, FinalizeGrading, GradingQueueFilters, UpdateTeacherComment } from "@workspace/types";
import { AppError } from "../../errors/app-error.js";
import { inngest } from "../inngest/client.js";

function mapCommentWithAuthor(comment: { author: { name: string | null; avatarUrl: string | null }; [key: string]: unknown }) {
  const { author, ...rest } = comment;
  return {
    ...rest,
    authorName: author.name ?? "Unknown",
    authorAvatarUrl: author.avatarUrl,
  };
}

export class GradingService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Resolve Firebase UID to user ID and verify teacher-class access.
   * Teachers can only access submissions from classes they teach.
   * ADMIN/OWNER have full access within their tenant.
   */
  private async verifyAccess(
    db: ReturnType<typeof getTenantedClient>,
    firebaseUid: string,
    classTeacherId: string | null | undefined,
  ): Promise<string> {
    const authAccount = await db.authAccount.findUniqueOrThrow({
      where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } },
    });
    const userId = authAccount.userId;

    // Teachers can only access submissions from classes they teach
    // ADMIN/OWNER have full access within tenant (RBAC middleware already verified role)
    if (classTeacherId && classTeacherId !== userId) {
      const membership = await db.centerMembership.findFirst({
        where: { userId },
        select: { role: true },
      });
      if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
        throw AppError.forbidden("You can only access submissions from your classes");
      }
    }

    return userId;
  }

  async triggerAnalysis(centerId: string, submissionId: string, firebaseUid: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            exercise: { select: { skill: true } },
            class: { select: { teacherId: true } },
          },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const skill = submission.assignment.exercise.skill;
    if (skill !== "WRITING" && skill !== "SPEAKING") {
      throw AppError.badRequest(
        "AI analysis is only available for Writing and Speaking submissions",
      );
    }

    if (submission.status !== "SUBMITTED" && submission.status !== "AI_PROCESSING") {
      throw AppError.badRequest("Submission must be in SUBMITTED status to trigger analysis");
    }

    // Create or replace grading job
    const existingJob = await db.gradingJob.findUnique({
      where: { submissionId },
    });

    let gradingJob;
    if (existingJob) {
      gradingJob = await db.gradingJob.update({
        where: { id: existingJob.id },
        data: {
          status: "pending",
          error: null,
          errorCategory: null,
        },
      });
    } else {
      gradingJob = await db.gradingJob.create({
        data: { centerId, submissionId, status: "pending" },
      });
    }

    await inngest.send({
      name: "grading/analyze-submission",
      data: {
        jobId: gradingJob.id,
        submissionId,
        centerId,
      },
    });

    return gradingJob;
  }

  async retriggerAnalysis(centerId: string, submissionId: string, firebaseUid: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            exercise: { select: { skill: true } },
            class: { select: { teacherId: true } },
          },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    // Validate skill BEFORE deleting data to prevent data loss on invalid requests
    const skill = submission.assignment.exercise.skill;
    if (skill !== "WRITING" && skill !== "SPEAKING") {
      throw AppError.badRequest(
        "AI analysis is only available for Writing and Speaking submissions",
      );
    }

    // Delete existing feedback so AI can regenerate
    await db.submissionFeedback.deleteMany({ where: { submissionId } });

    return this.triggerAnalysis(centerId, submissionId, firebaseUid);
  }

  async getAnalysisResults(centerId: string, submissionId: string, firebaseUid: string): Promise<{
    submission: Record<string, unknown>;
    analysisStatus: AnalysisStatus;
    feedback: Record<string, unknown> | null;
    teacherComments: Array<Record<string, unknown>>;
  }> {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        answers: true,
        assignment: {
          include: {
            exercise: { select: { title: true, skill: true } },
            class: { select: { id: true, name: true, teacherId: true } },
          },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const gradingJob = await db.gradingJob.findUnique({
      where: { submissionId },
    });

    const feedback = await db.submissionFeedback.findUnique({
      where: { submissionId },
      include: { items: true },
    });

    const teacherComments = await db.teacherComment.findMany({
      where: { submissionId },
      include: { author: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    const mappedComments = teacherComments.map(mapCommentWithAuthor);

    const analysisStatus = deriveAnalysisStatus(
      submission.assignment.exercise.skill,
      gradingJob?.status ?? null,
    );

    return {
      submission: submission as unknown as Record<string, unknown>,
      analysisStatus,
      feedback: feedback as unknown as Record<string, unknown> | null,
      teacherComments: mappedComments as unknown as Array<Record<string, unknown>>,
    };
  }

  async getGradingQueue(centerId: string, firebaseUid: string, filters: GradingQueueFilters) {
    const db = getTenantedClient(this.prisma, centerId);

    const authAccount = await db.authAccount.findUniqueOrThrow({
      where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } },
    });
    const teacherUserId = authAccount.userId;

    const { classId, assignmentId, status, page, limit } = filters;

    // Build where clause — teacher can only see submissions for classes they teach
    // When classId is provided, still verify teacher teaches that class
    const where: Record<string, unknown> = {
      assignment: {
        ...(assignmentId ? { id: assignmentId } : {}),
        ...(classId
          ? { classId, class: { teacherId: teacherUserId } }
          : { class: { teacherId: teacherUserId } }),
        exercise: {
          skill: { in: ["WRITING", "SPEAKING"] },
        },
      },
      status: { in: ["SUBMITTED", "AI_PROCESSING", "GRADED"] },
    };

    const include = {
      student: { select: { name: true } },
      assignment: {
        include: {
          exercise: { select: { title: true, skill: true } },
        },
      },
      gradingJob: { select: { status: true, error: true } },
    };

    // When filtering by analysis status (derived from GradingJob.status),
    // we must compute status for all matching items before paginating,
    // since the derived status cannot be filtered at the DB level.
    if (status) {
      const allSubmissions = await db.submission.findMany({
        where,
        include,
        orderBy: { submittedAt: "desc" },
      });

      const allItems = allSubmissions
        .map((s) => ({
          submissionId: s.id,
          studentName: s.student.name,
          assignmentTitle: s.assignment.exercise.title,
          exerciseSkill: s.assignment.exercise.skill,
          submittedAt: s.submittedAt?.toISOString() ?? null,
          analysisStatus: deriveAnalysisStatus(
            s.assignment.exercise.skill,
            s.gradingJob?.status ?? null,
          ),
          failureReason: s.gradingJob?.error ?? null,
        }))
        .filter((item) => item.analysisStatus === status);

      const total = allItems.length;
      const items = allItems.slice((page - 1) * limit, page * limit);

      return { items, total, page, limit };
    }

    // No status filter — use efficient DB-level pagination
    const total = await db.submission.count({ where });

    const submissions = await db.submission.findMany({
      where,
      include,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = submissions.map((s) => ({
      submissionId: s.id,
      studentName: s.student.name,
      assignmentTitle: s.assignment.exercise.title,
      exerciseSkill: s.assignment.exercise.skill,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      analysisStatus: deriveAnalysisStatus(
        s.assignment.exercise.skill,
        s.gradingJob?.status ?? null,
      ),
      failureReason: s.gradingJob?.error ?? null,
    }));

    return { items, total, page, limit };
  }

  async createComment(
    centerId: string,
    submissionId: string,
    firebaseUid: string,
    data: CreateTeacherComment,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    const authorId = await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    if (
      data.startOffset !== null &&
      data.startOffset !== undefined &&
      data.endOffset !== null &&
      data.endOffset !== undefined
    ) {
      if (data.startOffset < 0 || data.endOffset < 0) {
        throw AppError.badRequest("Offsets must be non-negative");
      }
      if (data.endOffset <= data.startOffset) {
        throw AppError.badRequest("endOffset must be greater than startOffset");
      }
    }

    const comment = await db.teacherComment.create({
      data: {
        centerId,
        submissionId,
        authorId,
        content: data.content,
        startOffset: data.startOffset ?? null,
        endOffset: data.endOffset ?? null,
        originalContextSnippet: data.originalContextSnippet ?? null,
        visibility: data.visibility,
      },
      include: { author: { select: { name: true, avatarUrl: true } } },
    });

    return mapCommentWithAuthor(comment);
  }

  async getComments(
    centerId: string,
    submissionId: string,
    firebaseUid: string,
    visibility?: CommentVisibility,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const comments = await db.teacherComment.findMany({
      where: {
        submissionId,
        ...(visibility ? { visibility } : {}),
      },
      include: { author: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    return comments.map(mapCommentWithAuthor);
  }

  async updateComment(
    centerId: string,
    submissionId: string,
    commentId: string,
    firebaseUid: string,
    data: UpdateTeacherComment,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    const userId = await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const comment = await db.teacherComment.findFirst({
      where: { id: commentId, submissionId },
    });
    if (!comment) throw AppError.notFound("Comment not found");
    if (comment.authorId !== userId) {
      throw AppError.forbidden("You can only edit your own comments");
    }

    const updated = await db.teacherComment.update({
      where: { id: commentId },
      data: {
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
      },
      include: { author: { select: { name: true, avatarUrl: true } } },
    });

    return mapCommentWithAuthor(updated);
  }

  async deleteComment(
    centerId: string,
    submissionId: string,
    commentId: string,
    firebaseUid: string,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    const userId = await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const comment = await db.teacherComment.findFirst({
      where: { id: commentId, submissionId },
    });
    if (!comment) throw AppError.notFound("Comment not found");
    if (comment.authorId !== userId) {
      throw AppError.forbidden("You can only delete your own comments");
    }

    await db.teacherComment.delete({ where: { id: commentId } });
  }

  async getSubmissionFeedback(centerId: string, submissionId: string, firebaseUid: string): Promise<Record<string, unknown>> {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            class: { select: { teacherId: true } },
          },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const feedback = await db.submissionFeedback.findUnique({
      where: { submissionId },
      include: { items: true },
    });
    if (!feedback) throw AppError.notFound("No feedback available for this submission");

    return feedback as unknown as Record<string, unknown>;
  }

  async approveFeedbackItem(
    centerId: string,
    submissionId: string,
    itemId: string,
    firebaseUid: string,
    data: ApproveFeedbackItem,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const item = await db.aIFeedbackItem.findFirst({
      where: {
        id: itemId,
        submissionFeedback: { submissionId },
      },
    });
    if (!item) throw AppError.notFound("Feedback item not found");

    const updated = await db.aIFeedbackItem.update({
      where: { id: itemId },
      data: {
        isApproved: data.isApproved,
        approvedAt: data.isApproved ? new Date() : null,
        teacherOverrideText: data.teacherOverrideText !== undefined ? data.teacherOverrideText : item.teacherOverrideText,
      },
    });

    return updated;
  }

  async bulkApproveFeedbackItems(
    centerId: string,
    submissionId: string,
    firebaseUid: string,
    data: BulkApproveFeedbackItems,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    const feedback = await db.submissionFeedback.findFirst({
      where: { submissionId },
    });
    if (!feedback) throw AppError.notFound("No feedback found for this submission");

    const result = await db.aIFeedbackItem.updateMany({
      where: {
        submissionFeedbackId: feedback.id,
        isApproved: null,
      },
      data: {
        isApproved: data.action === "approve_remaining",
        approvedAt: data.action === "approve_remaining" ? new Date() : null,
      },
    });

    return { count: result.count };
  }

  async finalizeGrading(
    centerId: string,
    submissionId: string,
    firebaseUid: string,
    data: FinalizeGrading,
  ) {
    const db = getTenantedClient(this.prisma, centerId);

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });
    if (!submission) throw AppError.notFound("Submission not found");

    await this.verifyAccess(db, firebaseUid, submission.assignment.class?.teacherId);

    if (submission.status === "GRADED") {
      throw AppError.conflict("Submission is already graded");
    }
    if (submission.status === "AI_PROCESSING") {
      throw AppError.badRequest("AI analysis is still running. Please wait before finalizing");
    }
    if (submission.status === "IN_PROGRESS") {
      throw AppError.badRequest("Student has not submitted yet");
    }

    const feedback = await db.submissionFeedback.findFirst({
      where: { submissionId },
    });

    // Atomic writes inside transaction — per project-context.md Rule 5
    await this.prisma.$transaction(async (tx) => {
      if (feedback) {
        // Auto-approve remaining pending items
        await tx.aIFeedbackItem.updateMany({
          where: {
            submissionFeedbackId: feedback.id,
            centerId,
            isApproved: null,
          },
          data: { isApproved: true, approvedAt: new Date() },
        });

        // Update teacher scores
        await tx.submissionFeedback.update({
          where: { id: feedback.id, centerId },
          data: {
            teacherFinalScore: data.teacherFinalScore ?? feedback.overallScore,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            teacherCriteriaScores: (data.teacherCriteriaScores ?? feedback.criteriaScores ?? undefined) as any,
            teacherGeneralFeedback: data.teacherGeneralFeedback ?? null,
          },
        });
      }

      // Set submission status to GRADED
      await tx.submission.update({
        where: { id: submissionId, centerId },
        data: { status: "GRADED" },
      });
    });

    // Find next submission in the grading queue
    const nextSubmission = await db.submission.findFirst({
      where: {
        centerId,
        id: { not: submissionId },
        status: "SUBMITTED",
        gradingJob: { status: "completed" },
      },
      orderBy: { submittedAt: "asc" },
      select: { id: true },
    });

    const teacherFinalScore = data.teacherFinalScore ?? feedback?.overallScore ?? null;

    return {
      submissionId,
      status: "GRADED" as const,
      teacherFinalScore,
      nextSubmissionId: nextSubmission?.id ?? null,
    };
  }
}

function deriveAnalysisStatus(
  skill: string,
  jobStatus: string | null,
): AnalysisStatus {
  if (skill !== "WRITING" && skill !== "SPEAKING") return "not_applicable";
  if (!jobStatus) return "failed"; // no job exists — trigger failed silently
  if (jobStatus === "pending" || jobStatus === "processing") return "analyzing";
  if (jobStatus === "completed") return "ready";
  if (jobStatus === "failed") return "failed";
  return "analyzing";
}
