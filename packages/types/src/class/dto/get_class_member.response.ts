import { Static, Type } from "@sinclair/typebox";
import { Nullable } from '../../nullable.js';
import { BaseResponseSchema } from '../../response.js';
import { AssignmentSchema } from '../../assignment/schema/assignment.schema.js';
import { ExerciseSchema } from '../../exercise/schema/exercise.schema.js';
import { SubmissionSchema } from '../../submission/schema/submission.schema.js';
import { UserSchema } from '../../user/schema/user.schema.js';
import { ClassMemberSchema } from '../schema/classMembers.schema.js';

export const GetClassMemberResponseSchema = BaseResponseSchema(
  Type.Object({
    classMember: ClassMemberSchema,
    user: UserSchema,
    assignments: Type.Array(
      Type.Object({
        assignment: AssignmentSchema,
        submission: Nullable(SubmissionSchema),
        exercise: ExerciseSchema,
      }),
    ),
  }),
);

export type GetClassMemberResponse = Static<
  typeof GetClassMemberResponseSchema
>;
