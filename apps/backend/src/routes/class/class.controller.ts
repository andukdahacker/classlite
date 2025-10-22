import {
  CreateClassInput,
  CreateClassResponse,
  DeleteClassInput,
  GetClassInput,
  GetClassListByUserInput,
  GetClassListInput,
  GetClassListResponse,
  GetClassMemberInput,
  GetClassMemberResponse,
  GetClassResponse,
  GetStudentClassInput,
  GetStudentClassResponse,
  NoDataResponse,
  UpdateClassInput,
  UpdateClassResponse,
} from "@workspace/types";
import ClassService from "./class.service.js";

class ClassController {
  constructor(private readonly classService: ClassService) {}

  async getClassMember(
    input: GetClassMemberInput,
  ): Promise<GetClassMemberResponse> {
    const classMember = await this.classService.getClassMember(input);

    if (!classMember) {
      throw new Error("Cannot find class member");
    }

    return {
      data: {
        classMember: classMember,
        assignments: classMember.assignments.map((e) => {
          return {
            assignment: e,
            exercise: e.exercise,
            submission: e.submission,
          };
        }),
        user: classMember.user,
      },
      message: "Get class member successfully",
    };
  }

  async createClass(input: CreateClassInput): Promise<CreateClassResponse> {
    const klass = await this.classService.createClass(input);

    return {
      data: {
        class: klass,
      },
      message: "Created class successfully",
    };
  }

  async getClass(input: GetClassInput): Promise<GetClassResponse> {
    const klass = await this.classService.getClassById(input);

    if (!klass) {
      throw new Error("Class is not found");
    }

    const classMembers = klass.classMembers.map((classMember) => {
      return {
        user: classMember.user,
        assignments: classMember.assignments.map((assignment) => {
          return {
            assignment: assignment,
            submission: assignment.submission,
            exercise: assignment.exercise,
          };
        }),
      };
    });

    return {
      data: {
        class: klass,
        classMembers,
      },
      message: "Get class successfully",
    };
  }

  async updateClass(input: UpdateClassInput): Promise<UpdateClassResponse> {
    const klass = await this.classService.updateClass(input);

    return {
      data: {
        class: klass,
      },
      message: "Updated class successfully",
    };
  }

  async deleteClass(input: DeleteClassInput): Promise<NoDataResponse> {
    await this.classService.deleteClass(input);

    return {
      message: "Deleted class successfully",
    };
  }

  async getClassList(input: GetClassListInput): Promise<GetClassListResponse> {
    const klasses = await this.classService.getClassList(input);

    const transformed = klasses.map((e) => {
      return {
        class: e,
        members: e.classMembers.map((classMember) => classMember.user),
      };
    });

    return {
      data: transformed,
      message: "Get class list successfully",
    };
  }

  async getClassListByUser(
    input: GetClassListByUserInput,
  ): Promise<GetClassListResponse> {
    const klasses = await this.classService.getClassListByUser(input);

    const transformed = klasses.map((e) => {
      return {
        class: e,
        members: e.classMembers.map((classMember) => classMember.user),
        enrolledAt: e.createdAt,
      };
    });

    return {
      data: transformed,
      message: "Get class list successfully",
    };
  }

  async getStudentClass(
    input: GetStudentClassInput & { userId: string },
  ): Promise<GetStudentClassResponse> {
    const result = await this.classService.getStudentClass(
      input.classId,
      input.userId,
    );

    if (!result) {
      throw new Error("Cannot get class");
    }

    return {
      data: {
        class: result.class,
        assignments: result.assignments.map((a) => ({
          assignment: a,
          exercise: a.exercise,
          submission: a.submission,
        })),
        teachers: result.class.classMembers
          .filter((cm) => cm.user.role == "TEACHER")
          .map((cm) => cm.user),
      },
      message: "Get student's class successfully",
    };
  }
}

export default ClassController;
