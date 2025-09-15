import { Static, Type } from "@sinclair/typebox";
import { ClassSchema } from "../../class/schema/class.schema.js";
import { ExerciseSchema } from "../../exercise/schema/exercise.schema.js";
import { PaginatedBaseReponseSchema } from "../../response.js";
import { AssignmentSchema } from "../schema/assignment.schema.js";

export const GetAssignmentsByUserResponseSchema = PaginatedBaseReponseSchema(
  Type.Object({
    assignment: AssignmentSchema,
    class: ClassSchema,
    exercise: ExerciseSchema,
  }),
);

export type GetAssignmentByUserResponse = Static<
  typeof GetAssignmentsByUserResponseSchema
>;
