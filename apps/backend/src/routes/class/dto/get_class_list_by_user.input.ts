import { Static, Type } from "@sinclair/typebox";

export const GetClassListByUserInputSchema = Type.Object(
  {
    userId: Type.String(),
  },
  { $id: "GetClassListByUserInput" },
);

export type GetClassListByUserInput = Static<
  typeof GetClassListByUserInputSchema
>;
