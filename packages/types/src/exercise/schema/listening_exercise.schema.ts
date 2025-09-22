import { Static, TSchema, Type } from "@sinclair/typebox";
import {
  createCompletionSchema,
  createMatchHTPSchemas,
  createMultipleChoiceSchemas,
  createTFNGSchemas,
  createYNNGSchemas,
} from "./generic_exercise.schema.js";

export const ListeningExerciseTypeSchema = Type.Union([
  Type.Literal("Multiple choice"),
  Type.Literal("True/False/Not Given"),
  Type.Literal("Yes/No/Not Given"),
  Type.Literal("Completion"),
  Type.Literal("Matching heading to paragraph"),
]);
export type ListeningExerciseType = Static<typeof ListeningExerciseTypeSchema>;
export const ListeningExerciseTypes: ListeningExerciseType[] = (
  ListeningExerciseTypeSchema.anyOf ?? []
).map((schema: TSchema) => schema.const as ListeningExerciseType);

// Schemas
const mc = createMultipleChoiceSchemas("Listening");
export const ListeningMultipleChoiceQuestionOptionSchema =
  mc.QuestionOptionSchema;
export type ListeningMultipleChoiceQuestionOption = Static<
  typeof ListeningMultipleChoiceQuestionOptionSchema
>;
export const ListeningMultipleChoiceQuestionSchema = mc.QuestionSchema;
export type ListeningMultipleChoiceQuestion = Static<
  typeof ListeningMultipleChoiceQuestionSchema
>;
export const ListeningMultipleChoiceTaskSchema = mc.TaskSchema;
export type ListeningMultipleChoiceTask = Static<
  typeof ListeningMultipleChoiceTaskSchema
>;

const tfng = createTFNGSchemas("Listening");
export const ListeningTFNGOptionSchema = tfng.OptionSchema;
export type ListeningTFNGOption = Static<typeof ListeningTFNGOptionSchema>;
export const ListeningTFNGQuestionSchema = tfng.QuestionSchema;
export type ListeningTFNGQuestion = Static<typeof ListeningTFNGQuestionSchema>;
export const ListeningTFNGTaskSchema = tfng.TaskSchema;
export type ListeningTFNGTask = Static<typeof ListeningTFNGTaskSchema>;

const ynng = createYNNGSchemas("Listening");
export const ListeningYNNGOptionSchema = ynng.OptionSchema;
export type ListeningYNNGOption = Static<typeof ListeningYNNGOptionSchema>;
export const ListeningYNNGQuestionSchema = ynng.QuestionSchema;
export type ListeningYNNGQuestion = Static<typeof ListeningYNNGQuestionSchema>;
export const ListeningYNNGTaskSchema = ynng.TaskSchema;
export type ListeningYNNGTask = Static<typeof ListeningYNNGTaskSchema>;

const completion = createCompletionSchema("Listening");
export const ListeningCompletionQuestionSchema = completion.QuestionSchema;
export type ListeningCompletionQuestion = Static<
  typeof ListeningCompletionQuestionSchema
>;
export const ListeningCompletionTaskSchema = completion.TaskSchema;
export type ListeningCompletionTask = Static<
  typeof ListeningCompletionTaskSchema
>;

const match = createMatchHTPSchemas("Listening");
export const ListeningMatchHTPOptionSchema = match.OptionSchema;
export type ListeningMatchHTPOption = Static<
  typeof ListeningMatchHTPOptionSchema
>;
export const ListeningMatchHTPQuestionSchema = match.QuestionSchema;
export type ListeningMatchHTPQuestion = Static<
  typeof ListeningMatchHTPQuestionSchema
>;
export const ListeningMatchHTPTaskSchema = match.TaskSchema;
export type ListeningMatchHTPTask = Static<typeof ListeningMatchHTPTaskSchema>;

// Union of all tasks
export const ListeningExerciseTaskSchema = Type.Union([
  ListeningMultipleChoiceTaskSchema,
  ListeningTFNGTaskSchema,
  ListeningYNNGTaskSchema,
  ListeningCompletionTaskSchema,
  ListeningMatchHTPTaskSchema,
]);
export type ListeningExerciseTask = Static<typeof ListeningExerciseTaskSchema>;

// Top-level exercise schema
export const ListeningExerciseSchema = Type.Object(
  {
    file: Type.Optional(
      Type.Object({
        url: Type.String(),
        key: Type.String(),
        fileName: Type.String(),
      }),
    ),
    tasks: Type.Array(ListeningExerciseTaskSchema),
  },
  { $id: "ListeningExercise" },
);
export type ListeningExercise = Static<typeof ListeningExerciseSchema>;
