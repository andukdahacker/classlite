import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ClassSchema } from "../../class/schema/class.schema.js";
import { UserSchema } from "../schema/user.schema.js";

export const GetUserListResponseSchema = BaseResponseSchema(
  Type.Array(
    Type.Object({
      user: UserSchema,
      classes: Type.Array(ClassSchema),
    }),
  ),
);

export type GetUserListResponse = Static<typeof GetUserListResponseSchema>;
