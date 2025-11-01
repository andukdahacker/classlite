import {
  CreateClassInput,
  DeleteClassInput,
  GetClassInput,
  GetClassListByUserInput,
  GetClassListInput,
  GetClassMemberInput,
  UpdateClassInput,
} from "@workspace/types";
import { PrismaClient } from "../../generated/prisma/client/client.js";

class ClassService {
  constructor(private readonly db: PrismaClient) {}

  async getClassByUserId(userId: string) {
    const klasses = await this.db.classMember.findMany({
      where: {
        userId,
      },
    });

    return klasses;
  }

  async getClassById(input: GetClassInput) {
    const klass = await this.db.class.findUnique({
      where: { id: input.classId },
      include: {
        classMembers: {
          include: {
            user: true,
            assignments: {
              include: {
                submission: true,
                exercise: true,
              },
            },
          },
        },
      },
    });

    return klass;
  }

  async createClass(input: CreateClassInput) {
    const klass = await this.db.class.create({
      data: {
        name: input.name,
        description: input.description,
        center: {
          connect: {
            id: input.centerId,
          },
        },
        classMembers: {
          createMany: { data: input.classMember.map((e) => ({ userId: e })) },
        },
      },
      include: {
        classMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    return klass;
  }

  async getClassList(input: GetClassListInput) {
    const klasses = await this.db.class.findMany({
      where: {
        centerId: input.centerId,
      },
      include: {
        classMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    return klasses;
  }

  async getClassListByUser(input: GetClassListByUserInput) {
    const klasses = await this.db.class.findMany({
      where: {
        classMembers: {
          some: {
            userId: input.userId,
          },
        },
      },
      include: {
        classMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    return klasses;
  }

  async updateClass(input: UpdateClassInput) {
    const klass = await this.db.class.update({
      where: {
        id: input.classId,
      },
      data: {
        name: input.name,
        description: input.description,
        classMembers: {
          deleteMany: input.removeMembers?.map((e) => ({ userId: e })),
          createMany: {
            data: input.addMembers?.map((e) => ({ userId: e })) ?? [],
          },
        },
      },
    });

    return klass;
  }

  async deleteClass(input: DeleteClassInput) {
    await this.db.class.delete({ where: { id: input.classId } });
  }

  async getClassMember(input: GetClassMemberInput) {
    console.log(input);
    const classMember = await this.db.classMember.findUnique({
      where: {
        classId_userId: {
          userId: input.userId,
          classId: input.classId,
        },
      },
      include: {
        assignments: {
          include: {
            exercise: true,
            submission: true,
          },
        },
        user: true,
      },
    });

    return classMember;
  }

  async getStudentClass(classId: string, userId: string) {
    const klass = await this.db.classMember.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      include: {
        assignments: {
          include: {
            exercise: true,
            submission: true,
          },
        },
        class: {
          include: {
            classMembers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return klass;
  }
}

export default ClassService;
