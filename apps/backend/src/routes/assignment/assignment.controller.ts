import {
  CreateAssignmentResponse,
  CreateAssignmentsInput,
  DeleteAssignmentsInput,
  GetAssignmentByUserResponse,
  GetAssignmentInput,
  GetAssignmentResponse,
  GetAssignmentsByExerciseInput,
  GetAssignmentsByExerciseResponse,
  GetAssignmentsByUserInput,
  NoDataResponse,
  UpdateAssignmentInput,
  UpdateAssignmentsResponse,
} from "@workspace/types";
import AssignmentService from "./assignment.service.js";

class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  async createAssignments(
    input: CreateAssignmentsInput,
  ): Promise<CreateAssignmentResponse> {
    const assignments = await this.assignmentService.createAssigments(input);

    return {
      data: {
        assignments,
      },
      message: "",
    };
  }

  async getAssignmentsByExercise(
    input: GetAssignmentsByExerciseInput,
  ): Promise<GetAssignmentsByExerciseResponse> {
    const assignments =
      await this.assignmentService.getAssignmentsByExercise(input);

    const mapped = assignments.map((e) => {
      return {
        assignment: e,
        user: e.classMember.user,
        class: e.classMember.class,
      };
    });

    return {
      data: {
        assignments: mapped,
      },
      message: "Get assignments successfully",
    };
  }

  async getAssigmentsByUser(
    input: GetAssignmentsByUserInput,
  ): Promise<GetAssignmentByUserResponse> {
    const assignments =
      await this.assignmentService.getAssignmentsByUser(input);

    const mapped = assignments.map((e) => {
      return {
        assignment: e,
        class: e.classMember.class,
        exercise: e.exercise,
      };
    });

    if (assignments.length < input.take) {
      return {
        data: {
          nodes: mapped,
          pageInfo: {
            hasNextPage: false,
          },
        },
        message: "Get assignments successfully",
      };
    }

    const cursor = assignments[assignments.length - 1]!.id;

    const nextCall = await this.assignmentService.getAssignmentsByUser({
      ...input,
      cursor,
    });

    if (nextCall.length == 0) {
      return {
        data: {
          nodes: mapped,
          pageInfo: {
            hasNextPage: false,
          },
        },
        message: "Get assignments successfully",
      };
    }

    return {
      data: {
        nodes: mapped,
        pageInfo: {
          hasNextPage: true,
          cursor,
        },
      },
      message: "Get assignments successfully",
    };
  }

  async getAssignment(
    input: GetAssignmentInput,
  ): Promise<GetAssignmentResponse> {
    const assignment = await this.assignmentService.getAssignment(input);

    if (!assignment) {
      throw new Error("Cannot find assignment");
    }

    return {
      data: {
        assignment: assignment,
        exercise: assignment.exercise,
        submission: assignment.submission,
      },
      message: "Get assignment successfully",
    };
  }

  async updateAssignment(
    input: UpdateAssignmentInput,
  ): Promise<UpdateAssignmentsResponse> {
    const updated = await this.assignmentService.updateAssignment(input);

    return {
      data: updated,
      message: "Updated assignments successfully",
    };
  }

  async deleteAssignment(
    input: DeleteAssignmentsInput,
  ): Promise<NoDataResponse> {
    await this.assignmentService.deleteAssignment(input);

    return {
      message: "Deleted assignment successfully",
    };
  }
}

export default AssignmentController;
