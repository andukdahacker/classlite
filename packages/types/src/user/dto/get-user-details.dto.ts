import { Static, Type } from "@sinclair/typebox";
import { AssignmentSchema } from "../../assignment/schema/assignment.schema.js";
import { ClassSchema } from "../../class/schema/class.schema.js";
import { UserSchema } from "../schema/user.schema.js";

export const GetUserDetailsResponseSchema = Type.Object({
  data: Type.Object({
    user: UserSchema,
    classes: Type.Array(
      Type.Object({
        class: ClassSchema,
        assignments: Type.Optional(Type.Array(AssignmentSchema)),
      }),
    ),
  }),
  message: Type.String(),
});

export type GetUserDetailsResponse = Static<
  typeof GetUserDetailsResponseSchema
>;
