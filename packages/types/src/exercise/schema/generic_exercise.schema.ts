import { Type } from "@sinclair/typebox";

type SchemaPrefix = "Reading" | "Listening";

export function createMultipleChoiceSchemas(prefix: SchemaPrefix) {
  const QuestionOptionSchema = Type.Object(
    {
      content: Type.String(),
      order: Type.Number(),
      value: Type.String(),
    },
    { $id: `${prefix}MultipleChoiceQuestionOption` },
  );

  const QuestionSchema = Type.Object(
    {
      content: Type.String(),
      correctAnswer: Type.String(),
      order: Type.Number(),
      options: Type.Array(QuestionOptionSchema),
    },
    { $id: `${prefix}MultipleChoiceQuestion` },
  );

  const TaskSchema = Type.Object(
    {
      order: Type.Number(),
      type: Type.Literal("Multiple choice"),
      instructions: Type.Any(),
      questions: Type.Array(QuestionSchema),
    },
    { $id: `${prefix}MultipleChoiceTask` },
  );

  return { QuestionOptionSchema, QuestionSchema, TaskSchema };
}

export function createTFNGSchemas(prefix: SchemaPrefix) {
  const OptionSchema = Type.Union(
    [Type.Literal("TRUE"), Type.Literal("FALSE"), Type.Literal("NOT GIVEN")],
    { $id: `${prefix}TFNGOption` },
  );

  const QuestionSchema = Type.Object(
    {
      order: Type.Number(),
      content: Type.String(),
      correctAnswer: OptionSchema,
    },
    { $id: `${prefix}TFNGQuestion` },
  );

  const TaskSchema = Type.Object(
    {
      order: Type.Number(),
      type: Type.Literal("True/False/Not Given"),
      instructions: Type.Any(),
      questions: Type.Array(QuestionSchema),
    },
    { $id: `${prefix}TFNGTask` },
  );

  return { OptionSchema, QuestionSchema, TaskSchema };
}

export function createYNNGSchemas(prefix: SchemaPrefix) {
  const OptionSchema = Type.Union(
    [Type.Literal("YES"), Type.Literal("NO"), Type.Literal("NOT GIVEN")],
    { $id: `${prefix}YNNGOption` },
  );

  const QuestionSchema = Type.Object(
    {
      order: Type.Number(),
      content: Type.String(),
      correctAnswer: OptionSchema,
    },
    { $id: `${prefix}YNNGQuestion` },
  );

  const TaskSchema = Type.Object(
    {
      order: Type.Number(),
      instructions: Type.Any(),
      type: Type.Literal("Yes/No/Not Given"),
      questions: Type.Array(QuestionSchema),
    },
    { $id: `${prefix}YNNGTask` },
  );

  return { OptionSchema, QuestionSchema, TaskSchema };
}

export function createCompletionSchema(prefix: SchemaPrefix) {
  const QuestionSchema = Type.Object(
    {
      order: Type.Number(),
      correctAnswer: Type.String(),
    },
    { $id: `${prefix}CompletionQuestion` },
  );

  const TaskSchema = Type.Object(
    {
      order: Type.Number(),
      type: Type.Literal("Completion"),
      instructions: Type.Optional(Type.Any()),
      title: Type.Optional(Type.String()),
      content: Type.Optional(Type.Any()),
      questions: Type.Array(QuestionSchema),
      taskType: Type.Optional(
        Type.Union([Type.Literal("Typing"), Type.Literal("DragAndDrop")]),
      ),
      options: Type.Optional(Type.Array(Type.String())),
    },
    { $id: `${prefix}CompletionTask` },
  );

  return { QuestionSchema, TaskSchema };
}

export function createMatchHTPSchemas(prefix: SchemaPrefix) {
  const OptionSchema = Type.Object(
    {
      order: Type.Number(),
      value: Type.String(),
      content: Type.String(),
    },
    { $id: `${prefix}MatchHTPOption` },
  );

  const QuestionSchema = Type.Object(
    {
      order: Type.Number(),
      content: Type.String(),
      correctAnswer: Type.String(),
    },
    { $id: `${prefix}MatchHTPQuestion` },
  );

  const TaskSchema = Type.Object(
    {
      order: Type.Number(),
      type: Type.Literal("Matching heading to paragraph"),
      instructions: Type.Any(),
      questions: Type.Array(QuestionSchema),
      options: Type.Array(OptionSchema),
    },
    { $id: `${prefix}MatchHTPTask` },
  );

  return { OptionSchema, QuestionSchema, TaskSchema };
}
