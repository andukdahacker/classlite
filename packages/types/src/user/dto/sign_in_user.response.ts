import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../schema/user.schema.js";

export const SignInUserResponseSchema = BaseResponseSchema(
  Type.Object({
    token: Type.String(),
    user: UserSchema,
  }),
);

export type SignInUserResponse = Static<typeof SignInUserResponseSchema>;
