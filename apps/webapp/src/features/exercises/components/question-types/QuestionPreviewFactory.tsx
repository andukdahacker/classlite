import type { IeltsQuestionType, Question } from "@workspace/types";
import { MCQPreview } from "./MCQPreview";
import { TFNGPreview } from "./TFNGPreview";
import { TextInputPreview } from "./TextInputPreview";
import { WordBankPreview } from "./WordBankPreview";

interface QuestionPreviewFactoryProps {
  sectionType: IeltsQuestionType;
  question: Question;
  questionIndex: number;
}

export function QuestionPreviewFactory({
  sectionType,
  question,
  questionIndex,
}: QuestionPreviewFactoryProps) {
  switch (sectionType) {
    case "R1_MCQ_SINGLE":
    case "R2_MCQ_MULTI":
      return (
        <MCQPreview
          sectionType={sectionType}
          questionText={question.questionText}
          questionIndex={questionIndex}
          options={question.options as { items: { label: string; text: string }[]; maxSelections?: number } | null}
        />
      );

    case "R3_TFNG":
    case "R4_YNNG":
      return (
        <TFNGPreview
          sectionType={sectionType}
          questionText={question.questionText}
          questionIndex={questionIndex}
        />
      );

    case "R5_SENTENCE_COMPLETION":
    case "R6_SHORT_ANSWER":
    case "R8_SUMMARY_PASSAGE":
      return (
        <TextInputPreview
          questionText={question.questionText}
          questionIndex={questionIndex}
          wordLimit={question.wordLimit}
        />
      );

    case "R7_SUMMARY_WORD_BANK":
      return (
        <WordBankPreview
          questionIndex={questionIndex}
          options={question.options as { wordBank: string[]; summaryText: string } | null}
        />
      );

    default:
      return (
        <div className="flex gap-3 pl-4">
          <span className="text-sm font-medium min-w-[2rem]">
            {questionIndex + 1}.
          </span>
          <span className="text-sm">{question.questionText}</span>
        </div>
      );
  }
}
