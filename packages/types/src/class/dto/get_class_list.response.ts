import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../../user/schema/user.schema.js";
import { ClassSchema } from "../schema/class.schema.js";

export const GetClassListResponseSchema = BaseResponseSchema(
  Type.Array(
    Type.Object({
      class: ClassSchema,
      members: Type.Array(UserSchema),
      enrolledAt: Type.Optional(Type.Any()),
    }),
  ),
);

export type GetClassListResponse = Static<typeof GetClassListResponseSchema>;
