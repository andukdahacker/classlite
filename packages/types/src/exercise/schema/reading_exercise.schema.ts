import { Static, TSchema, Type } from "@sinclair/typebox";
import {
  createCompletionSchema,
  createMatchHTPSchemas,
  createMultipleChoiceSchemas,
  createTFNGSchemas,
  createYNNGSchemas,
} from "./generic_exercise.schema.js";

export const ReadingExerciseTypeSchema = Type.Union([
  Type.Literal("Multiple choice"),
  Type.Literal("True/False/Not Given"),
  Type.Literal("Yes/No/Not Given"),
  Type.Literal("Completion"),
  Type.Literal("Matching heading to paragraph"),
  Type.Literal("Diagram Labeling"),
]);
export type ReadingExerciseType = Static<typeof ReadingExerciseTypeSchema>;
export const ReadingExerciseTypes: ReadingExerciseType[] = (
  ReadingExerciseTypeSchema.anyOf ?? []
).map((schema: TSchema) => schema.const as ReadingExerciseType);

// Schemas
const mc = createMultipleChoiceSchemas("Reading");
export const ReadingMultipleChoiceQuestionOptionSchema =
  mc.QuestionOptionSchema;
export type ReadingMultipleChoiceQuestionOption = Static<
  typeof ReadingMultipleChoiceQuestionOptionSchema
>;
export const ReadingMultipleChoiceQuestionSchema = mc.QuestionSchema;
export type ReadingMultipleChoiceQuestion = Static<
  typeof ReadingMultipleChoiceQuestionSchema
>;
export const ReadingMultipleChoiceTaskSchema = mc.TaskSchema;
export type ReadingMultipleChoiceTask = Static<
  typeof ReadingMultipleChoiceTaskSchema
>;

const tfng = createTFNGSchemas("Reading");
export const ReadingTFNGOptionSchema = tfng.OptionSchema;
export type ReadingTFNGOption = Static<typeof ReadingTFNGOptionSchema>;
export const ReadingTFNGQuestionSchema = tfng.QuestionSchema;
export type ReadingTFNGQuestion = Static<typeof ReadingTFNGQuestionSchema>;
export const ReadingTFNGTaskSchema = tfng.TaskSchema;
export type ReadingTFNGTask = Static<typeof ReadingTFNGTaskSchema>;

const ynng = createYNNGSchemas("Reading");
export const ReadingYNNGOptionSchema = ynng.OptionSchema;
export type ReadingYNNGOption = Static<typeof ReadingYNNGOptionSchema>;
export const ReadingYNNGQuestionSchema = ynng.QuestionSchema;
export type ReadingYNNGQuestion = Static<typeof ReadingYNNGQuestionSchema>;
export const ReadingYNNGTaskSchema = ynng.TaskSchema;
export type ReadingYNNGTask = Static<typeof ReadingYNNGTaskSchema>;

const completion = createCompletionSchema("Reading");
export const ReadingCompletionQuestionSchema = completion.QuestionSchema;
export type ReadingCompletionQuestion = Static<
  typeof ReadingCompletionQuestionSchema
>;
export const ReadingCompletionTaskSchema = completion.TaskSchema;
export type ReadingCompletionTask = Static<typeof ReadingCompletionTaskSchema>;

export const ReadingDiagramLabelCompletionQuestionSchema = Type.Object(
  {
    order: Type.Number(),
    correctAnswer: Type.String(),
  },
  { $id: "ReadingDiagramLabelCompletionQuestion" },
);
export type ReadingDiagramLabelCompletionQuestion = Static<
  typeof ReadingDiagramLabelCompletionQuestionSchema
>;

export const ReadingDiagramLabelCompletionTaskSchema = Type.Object(
  {
    order: Type.Number(),
    type: Type.Literal("Diagram Labeling"),
    instructions: Type.Any(),
    diagram: Type.Any(),
    questions: Type.Array(ReadingDiagramLabelCompletionQuestionSchema),
  },
  { $id: "ReadingDiagramLabelCompletionTask" },
);
export type ReadingDiagramLabelCompletionTask = Static<
  typeof ReadingDiagramLabelCompletionTaskSchema
>;

const match = createMatchHTPSchemas("Reading");
export const ReadingMatchHTPOptionSchema = match.OptionSchema;
export type ReadingMatchHTPOption = Static<typeof ReadingMatchHTPOptionSchema>;
export const ReadingMatchHTPQuestionSchema = match.QuestionSchema;
export type ReadingMatchHTPQuestion = Static<
  typeof ReadingMatchHTPQuestionSchema
>;
export const ReadingMatchHTPTaskSchema = match.TaskSchema;
export type ReadingMatchHTPTask = Static<typeof ReadingMatchHTPTaskSchema>;

export const ReadingExerciseTaskSchema = Type.Union([
  ReadingMultipleChoiceTaskSchema,
  ReadingTFNGTaskSchema,
  ReadingYNNGTaskSchema,
  ReadingCompletionTaskSchema,
  ReadingDiagramLabelCompletionTaskSchema,
  ReadingMatchHTPTaskSchema,
]);
export type ReadingExerciseTask = Static<typeof ReadingExerciseTaskSchema>;

//Reading exercise
export const ReadingExerciseSchema = Type.Object(
  {
    title: Type.String(),
    content: Type.Any(),
    tasks: Type.Array(ReadingExerciseTaskSchema),
  },
  { $id: "ReadingExercise" },
);
export type ReadingExercise = Static<typeof ReadingExerciseSchema>;
