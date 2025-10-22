import { Static, Type } from "@sinclair/typebox";

export const GetStudentClassInputSchema = Type.Object({
  classId: Type.String(),
});

export type GetStudentClassInput = Static<typeof GetStudentClassInputSchema>;
