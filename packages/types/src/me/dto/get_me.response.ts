import { Static, Type } from "@sinclair/typebox";
import { CenterSchema } from "../../center/schema/center.schema.js";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../../user/schema/user.schema.js";

export const GetMeResponseSchema = BaseResponseSchema(
  Type.Object({
    center: Type.Optional(CenterSchema),
    user: Type.Optional(UserSchema),
  }),
);

export type GetMeResponse = Static<typeof GetMeResponseSchema>;
