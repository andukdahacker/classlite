import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../schema/user.schema.js";

export const CreateUserResponseSchema = BaseResponseSchema(
  Type.Object({
    user: UserSchema,
  }),
);

export type CreateUserResponse = Static<typeof CreateUserResponseSchema>;
