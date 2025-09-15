import { Static, Type } from "@sinclair/typebox";

export const GetUserListInputSchema = Type.Object(
  {
    searchString: Type.Optional(Type.String()),
  },
  {
    $id: "GetUserListInput",
  },
);

export type GetUserListInput = Static<typeof GetUserListInputSchema>;
