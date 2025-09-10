import { Static, Type } from "@sinclair/typebox";

export const GetClassListInputSchema = Type.Object(
  {
    centerId: Type.String(),
  },
  { $id: "GetClassListInput" },
);

export type GetClassListInput = Static<typeof GetClassListInputSchema>;
