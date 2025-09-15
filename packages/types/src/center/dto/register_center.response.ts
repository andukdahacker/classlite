import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { CenterSchema } from "../schema/center.schema.js";

export const RegisterCenterResponseSchema = BaseResponseSchema(
  Type.Object({
    center: CenterSchema,
  }),
);

export type RegisterCenterResponse = Static<
  typeof RegisterCenterResponseSchema
>;
