import type { IeltsQuestionType } from "@workspace/types";
import { z } from "zod";
import { MCQEditor } from "./MCQEditor";
import { TFNGEditor } from "./TFNGEditor";
import { TextInputEditor } from "./TextInputEditor";
import { WordBankEditor } from "./WordBankEditor";

interface QuestionEditorFactoryProps {
  sectionType: IeltsQuestionType;
  options: unknown;
  correctAnswer: unknown;
  wordLimit?: number | null;
  questionId?: string;
  onChange: (options: unknown, correctAnswer: unknown, wordLimit?: number | null) => void;
}

// Lenient editor schemas — check shape only, not completeness (min counts).
// The strict schemas in @workspace/types are for validation; these are for
// safely coercing DB data during editing (where 0-1 items is valid WIP).
const LenientMCQOptions = z.object({
  items: z.array(z.object({ label: z.string(), text: z.string() })),
  maxSelections: z.number().optional(),
});
const LenientMCQAnswer = z.object({
  answer: z.string().optional(),
  answers: z.array(z.string()).optional(),
});
const LenientTFNGAnswer = z.object({ answer: z.string() });
const LenientTextAnswer = z.object({
  answer: z.string(),
  acceptedVariants: z.array(z.string()),
  caseSensitive: z.boolean(),
});
const LenientWordBankOptions = z.object({
  wordBank: z.array(z.string()),
  summaryText: z.string(),
});
const LenientWordBankAnswer = z.object({
  blanks: z.record(z.string(), z.string()),
});

/** Safely parse unknown data, returning null on failure */
function safeParse<T>(schema: { safeParse: (data: unknown) => { success: boolean; data?: T } }, data: unknown): T | null {
  if (data == null) return null;
  const result = schema.safeParse(data);
  return result.success ? (result.data as T) : null;
}

export function QuestionEditorFactory({
  sectionType,
  options,
  correctAnswer,
  wordLimit,
  questionId,
  onChange,
}: QuestionEditorFactoryProps) {
  switch (sectionType) {
    case "R1_MCQ_SINGLE":
    case "R2_MCQ_MULTI":
      return (
        <MCQEditor
          sectionType={sectionType}
          options={safeParse(LenientMCQOptions, options)}
          correctAnswer={safeParse(LenientMCQAnswer, correctAnswer)}
          onChange={onChange}
        />
      );

    case "R3_TFNG":
    case "R4_YNNG":
      return (
        <TFNGEditor
          sectionType={sectionType}
          correctAnswer={safeParse(LenientTFNGAnswer, correctAnswer)}
          questionId={questionId}
          onChange={(opts, ans) => onChange(opts, ans)}
        />
      );

    case "R5_SENTENCE_COMPLETION":
    case "R6_SHORT_ANSWER":
    case "R8_SUMMARY_PASSAGE":
      return (
        <TextInputEditor
          correctAnswer={safeParse(LenientTextAnswer, correctAnswer)}
          wordLimit={wordLimit ?? null}
          onChange={onChange}
        />
      );

    case "R7_SUMMARY_WORD_BANK":
      return (
        <WordBankEditor
          options={safeParse(LenientWordBankOptions, options)}
          correctAnswer={safeParse(LenientWordBankAnswer, correctAnswer)}
          onChange={(opts, ans) => onChange(opts, ans)}
        />
      );

    default:
      return (
        <p className="text-xs text-muted-foreground italic">
          No editor available for question type: {sectionType}
        </p>
      );
  }
}
