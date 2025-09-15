import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { CenterSchema } from "../schema/center.schema.js";

export const GetCenterResponseSchema = BaseResponseSchema(
  Type.Object({
    center: CenterSchema,
  }),
);

export type GetCenterResponse = Static<typeof GetCenterResponseSchema>;
