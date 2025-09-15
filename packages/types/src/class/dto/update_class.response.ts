import { Static, Type } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ClassSchema } from "../schema/class.schema.js";

export const UpdateClassResponseSchema = BaseResponseSchema(
  Type.Object({
    class: ClassSchema,
  }),
);

export type UpdateClassResponse = Static<typeof UpdateClassResponseSchema>;
