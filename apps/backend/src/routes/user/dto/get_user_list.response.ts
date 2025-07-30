import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../../types/response";
import { ClassSchema } from "../../class/schema/class.schema";
import { UserSchema } from "../schema/user.schema";

export const GetUserListResponseSchema = BaseResponseSchema(
  Type.Array(
    Type.Object({
      user: UserSchema,
      classes: Type.Array(ClassSchema),
    }),
  ),
);

export type GetUserListResponse = Static<typeof GetUserListResponseSchema>;
