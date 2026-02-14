import { SubmissionsService } from "./submissions.service.js";

/** Serialize all Date fields in an object to ISO strings. */
function serializeDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Date) {
      (result as Record<string, unknown>)[key] = (result[key] as Date).toISOString();
    }
  }
  return result;
}

function serializeSubmission(submission: Record<string, unknown>) {
  const serialized = serializeDates(submission);
  if (Array.isArray(serialized.answers)) {
    serialized.answers = serialized.answers.map((a: Record<string, unknown>) =>
      serializeDates(a),
    );
  }
  return serialized;
}

export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}

  async start(
    user: { uid: string; centerId: string },
    input: { assignmentId: string },
  ) {
    const submission = await this.service.startSubmission(
      user.centerId,
      input.assignmentId,
      user.uid,
    );
    return {
      data: serializeSubmission(submission as unknown as Record<string, unknown>),
      message: "Submission started",
    };
  }

  async get(submissionId: string, user: { uid: string; centerId: string }) {
    const submission = await this.service.getSubmission(
      user.centerId,
      submissionId,
      user.uid,
    );
    return {
      data: serializeSubmission(submission as unknown as Record<string, unknown>),
      message: "Submission retrieved",
    };
  }

  async saveAnswers(
    submissionId: string,
    input: { answers: Array<{ questionId: string; answer?: unknown }> },
    user: { uid: string; centerId: string },
  ) {
    const submission = await this.service.saveAnswers(
      user.centerId,
      submissionId,
      input.answers,
      user.uid,
    );
    return {
      data: serializeSubmission(submission as unknown as Record<string, unknown>),
      message: "Answers saved",
    };
  }

  async submit(
    submissionId: string,
    input: { timeSpentSec?: number },
    user: { uid: string; centerId: string },
  ) {
    const submission = await this.service.submitSubmission(
      user.centerId,
      submissionId,
      input.timeSpentSec,
      user.uid,
    );
    return {
      data: serializeSubmission(submission as unknown as Record<string, unknown>),
      message: "Submission submitted successfully",
    };
  }

  async uploadPhoto(
    submissionId: string,
    questionId: string,
    fileBuffer: Buffer,
    contentType: string,
    user: { uid: string; centerId: string },
  ) {
    const result = await this.service.uploadPhoto(
      user.centerId,
      submissionId,
      questionId,
      fileBuffer,
      contentType,
      user.uid,
    );
    return {
      data: result,
      message: "Photo uploaded",
    };
  }

  async getAssignmentDetail(
    assignmentId: string,
    user: { uid: string; centerId: string },
  ) {
    const assignment = await this.service.getStudentAssignmentWithExercise(
      user.centerId,
      assignmentId,
      user.uid,
    );

    // Serialize dates in nested objects
    const serialized = JSON.parse(JSON.stringify(assignment));

    return {
      data: serialized,
      message: "Assignment detail retrieved",
    };
  }
}
