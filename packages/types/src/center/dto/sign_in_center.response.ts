import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { CenterSchema } from "../schema/center.schema.js";

export const SignInCenterResponseSchema = BaseResponseSchema(
  Type.Object({
    token: Type.String(),
    center: CenterSchema,
  }),
);

export type SignInCenterResponse = Static<typeof SignInCenterResponseSchema>;
