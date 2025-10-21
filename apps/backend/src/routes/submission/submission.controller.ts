import {
  CreateSubmissionInput,
  CreateSubmissionResponse,
  Exercise,
  GetSubmissionInput,
  GetSubmissionListInput,
  GetSubmissionListResponse,
  GetSubmissionResponse,
  ListeningExercise,
  ListeningSubmissionContent,
  ListeningSubmissionGrade,
  ReadingExercise,
  ReadingSubmissionContent,
  ReadingSubmissionGrade,
  UpdateSubmissionInput,
  UpdateSubmissionResponse,
} from "@workspace/types";
import AssignmentService from "../assignment/assignment.service.js";
import ClassService from "../class/class.service.js";
import SubmissionService from "./submission.service.js";

class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly assignmentService: AssignmentService,
    private readonly classMemberService: ClassService,
  ) {}

  async createSubmission(
    input: CreateSubmissionInput,
  ): Promise<CreateSubmissionResponse> {
    const assignment = await this.assignmentService.getAssignment({
      id: input.assignmentId,
    });

    if (!assignment) {
      throw new Error("Cannot find assignment");
    }

    const exercise = assignment.exercise;

    const grade = this.autoGrade(exercise, input.content);

    const submission = await this.submissionService.createSubmission(
      input,
      grade,
    );

    await this.assignmentService.updateAssignment({
      id: submission.assignmentId,
      status: "SUBMITTED",
    });

    return {
      data: submission,
      message: "Created submission successfully",
    };
  }

  autoGrade(exercise: Exercise, content: any) {
    switch (exercise.type) {
      case "READING": {
        const readingSubmissionContent = content as ReadingSubmissionContent;
        const exerciseContent = exercise.content as ReadingExercise;

        let score = 0;
        let total = 0;

        readingSubmissionContent.tasks.forEach((task, index) => {
          const exerciseTask = exerciseContent.tasks[index];
          if (!exerciseTask) return;
          task.questions.forEach((question, index) => {
            total++;
            const answer = question.answer;
            const correctAnswer = exerciseTask.questions[index]!.correctAnswer;

            if (answer != null && correctAnswer == answer) {
              score++;
            }
          });
        });

        return {
          score,
          total,
        } as ReadingSubmissionGrade;
      }
      case "LISTENING": {
        const readingSubmissionContent = content as ListeningSubmissionContent;
        const exerciseContent = exercise.content as ListeningExercise;

        let score = 0;
        let total = 0;

        readingSubmissionContent.tasks.forEach((task, index) => {
          const exerciseTask = exerciseContent.tasks[index];
          task.questions.forEach((question, index) => {
            total++;
            const answer = question.answer;
            const correctAnswer = exerciseTask!.questions[index]!.correctAnswer;

            if (answer != null && correctAnswer == answer) {
              score++;
            }
          });
        });

        return {
          score,
          total,
        } as ListeningSubmissionGrade;
      }
      default: {
        return null;
      }
    }
  }

  async getSubmission(
    input: GetSubmissionInput,
  ): Promise<GetSubmissionResponse> {
    const submission = await this.submissionService.getSubmission(input);

    if (!submission) {
      throw new Error("Cannot find submission");
    }

    return {
      data: {
        submission: submission,
        exercise: submission.assignment.exercise,
        assignment: submission.assignment,
      },
      message: "Get submission successfully",
    };
  }

  async getSubmissions(
    input: GetSubmissionListInput,
    userId: string,
  ): Promise<GetSubmissionListResponse> {
    const classMember = await this.classMemberService.getClassByUserId(userId);

    const classIds = classMember.map((e) => e.classId);

    const submissions = await this.submissionService.getSubmissions(
      input,
      classIds,
    );

    if (submissions.length < input.take) {
      return {
        data: {
          nodes: submissions,
          pageInfo: {
            hasNextPage: false,
          },
        },
        message: "Get submissions successfully",
      };
    }

    const cursor = submissions[submissions.length - 1]!.id;

    const nextCall = await this.submissionService.getSubmissions(
      { ...input, cursor },
      classIds,
    );

    if (nextCall.length == 0) {
      return {
        data: {
          nodes: submissions,
          pageInfo: {
            hasNextPage: false,
          },
        },
        message: "Get submissions successfully",
      };
    }

    return {
      data: {
        nodes: submissions,
        pageInfo: {
          hasNextPage: true,
          cursor,
        },
      },
      message: "Get submissions successfully",
    };
  }

  async updateSubmission(
    input: UpdateSubmissionInput,
  ): Promise<UpdateSubmissionResponse> {
    const submission = await this.submissionService.updateSubmission(input);

    if (input.isReviewed && submission.assignment.status != "REVIEWED") {
      await this.assignmentService.updateAssignment({
        id: submission.assignmentId,
        status: "REVIEWED",
      });
    }

    return {
      data: {
        assignment: submission.assignment,
        exercise: submission.assignment.exercise,
        submission: submission,
      },
      message: "Update submission successfully",
    };
  }
}

export default SubmissionController;
