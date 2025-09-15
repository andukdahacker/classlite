import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../schema/user.schema.js";

export const UpdateUserResponseSchema = BaseResponseSchema(
  Type.Object({
    user: UserSchema,
  }),
);

export type UpdateUserResponse = Static<typeof UpdateUserResponseSchema>;
