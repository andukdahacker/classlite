import { Static } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { UserSchema } from "../schema/user.schema.js";

export const GetUserResponseSchema = BaseResponseSchema(UserSchema);

export type GetUserResponse = Static<typeof GetUserResponseSchema>;
