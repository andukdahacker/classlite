import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import { MCQEditor } from "./MCQEditor";
import { TFNGEditor } from "./TFNGEditor";
import { TextInputEditor } from "./TextInputEditor";
import { WordBankEditor } from "./WordBankEditor";
import { QuestionEditorFactory } from "./QuestionEditorFactory";
import { MCQPreview } from "./MCQPreview";
import { TFNGPreview } from "./TFNGPreview";
import { TextInputPreview } from "./TextInputPreview";
import { WordBankPreview } from "./WordBankPreview";
import { QuestionPreviewFactory } from "./QuestionPreviewFactory";

// --- Task 9.1: MCQEditor ---
describe("MCQEditor", () => {
  it("renders existing options", () => {
    const onChange = vi.fn();
    render(
      <MCQEditor
        sectionType="R1_MCQ_SINGLE"
        options={{
          items: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
          ],
        }}
        correctAnswer={{ answer: "A" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByDisplayValue("Option A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option B")).toBeInTheDocument();
  });

  it("adds a new option", () => {
    const onChange = vi.fn();
    render(
      <MCQEditor
        sectionType="R1_MCQ_SINGLE"
        options={{ items: [{ label: "A", text: "Option A" }] }}
        correctAnswer={{ answer: "" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("Add Option"));
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.items).toHaveLength(2);
    expect(options.items[1].label).toBe("B");
  });

  it("removes an option", () => {
    const onChange = vi.fn();
    render(
      <MCQEditor
        sectionType="R1_MCQ_SINGLE"
        options={{
          items: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
          ],
        }}
        correctAnswer={{ answer: "" }}
        onChange={onChange}
      />,
    );
    // Find trash buttons by destructive class
    const allButtons = screen.getAllByRole("button");
    const trashButton = allButtons.find(
      (btn) => btn.classList.contains("text-destructive"),
    );
    expect(trashButton).toBeTruthy();
    fireEvent.click(trashButton!);
    expect(onChange).toHaveBeenCalled();
  });

  it("renders checkboxes for MCQ Multi", () => {
    const onChange = vi.fn();
    render(
      <MCQEditor
        sectionType="R2_MCQ_MULTI"
        options={{
          items: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
          ],
          maxSelections: 2,
        }}
        correctAnswer={{ answers: [] }}
        onChange={onChange}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it("handles null options gracefully", () => {
    const onChange = vi.fn();
    render(
      <MCQEditor
        sectionType="R1_MCQ_SINGLE"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    // Should render Add Option button with no items
    expect(screen.getByText("Add Option")).toBeInTheDocument();
  });
});

// --- Task 9.2: TFNGEditor ---
describe("TFNGEditor", () => {
  it("renders TFNG options", () => {
    const onChange = vi.fn();
    render(
      <TFNGEditor
        sectionType="R3_TFNG"
        correctAnswer={{ answer: "TRUE" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
    expect(screen.getByText("Not Given")).toBeInTheDocument();
  });

  it("renders YNNG options for R4", () => {
    const onChange = vi.fn();
    render(
      <TFNGEditor
        sectionType="R4_YNNG"
        correctAnswer={{ answer: "YES" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("Not Given")).toBeInTheDocument();
  });

  it("calls onChange when selecting an answer", () => {
    const onChange = vi.fn();
    render(
      <TFNGEditor
        sectionType="R3_TFNG"
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    // Click on the "False" radio
    fireEvent.click(screen.getByLabelText("False"));
    expect(onChange).toHaveBeenCalledWith(null, { answer: "FALSE" });
  });

  it("handles null correctAnswer gracefully", () => {
    const onChange = vi.fn();
    render(
      <TFNGEditor
        sectionType="R3_TFNG"
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("True")).toBeInTheDocument();
  });
});

// --- Task 9.3: TextInputEditor ---
describe("TextInputEditor", () => {
  it("renders correct answer input", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{
          answer: "revolution",
          acceptedVariants: ["revolt"],
          caseSensitive: false,
        }}
        wordLimit={3}
        onChange={onChange}
      />,
    );
    expect(screen.getByDisplayValue("revolution")).toBeInTheDocument();
    expect(screen.getByText("revolt")).toBeInTheDocument();
  });

  it("adds a variant", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{
          answer: "answer",
          acceptedVariants: [],
          caseSensitive: false,
        }}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    const variantInput = screen.getByPlaceholderText("Add accepted variant...");
    fireEvent.change(variantInput, { target: { value: "new variant" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onChange).toHaveBeenCalled();
    const [, correctAnswer] = onChange.mock.calls[0];
    expect(correctAnswer.acceptedVariants).toContain("new variant");
  });

  it("shows word limit input", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{
          answer: "test",
          acceptedVariants: [],
          caseSensitive: false,
        }}
        wordLimit={3}
        onChange={onChange}
      />,
    );
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("handles null correctAnswer gracefully", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={null}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByPlaceholderText("Enter the correct answer...")).toBeInTheDocument();
  });
});

// --- Task 9.4: WordBankEditor ---
describe("WordBankEditor", () => {
  it("renders word bank chips", () => {
    const onChange = vi.fn();
    render(
      <WordBankEditor
        options={{
          wordBank: ["climate", "population"],
          summaryText: "The ___1___ affects ___2___.",
        }}
        correctAnswer={{ blanks: { "1": "climate" } }}
        onChange={onChange}
      />,
    );
    // "climate" appears in both the badge and the dropdown, so use getAllByText
    expect(screen.getAllByText("climate").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("population").length).toBeGreaterThanOrEqual(1);
  });

  it("renders blank assignment dropdowns", () => {
    const onChange = vi.fn();
    render(
      <WordBankEditor
        options={{
          wordBank: ["word1", "word2"],
          summaryText: "Text ___1___ and ___2___.",
        }}
        correctAnswer={{ blanks: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Blank 1:")).toBeInTheDocument();
    expect(screen.getByText("Blank 2:")).toBeInTheDocument();
  });

  it("adds a word to the bank", () => {
    const onChange = vi.fn();
    render(
      <WordBankEditor
        options={{
          wordBank: ["existing"],
          summaryText: "Text ___1___.",
        }}
        correctAnswer={{ blanks: {} }}
        onChange={onChange}
      />,
    );
    const wordInput = screen.getByPlaceholderText("Add a word to the bank...");
    fireEvent.change(wordInput, { target: { value: "newword" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.wordBank).toContain("newword");
  });

  it("handles null options gracefully", () => {
    const onChange = vi.fn();
    render(
      <WordBankEditor
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    // The placeholder contains "___1___" syntax description
    expect(screen.getByPlaceholderText(/urban growth/i)).toBeInTheDocument();
  });
});

// --- Task 9.5: QuestionEditorFactory ---
describe("QuestionEditorFactory", () => {
  it("renders MCQEditor for R1_MCQ_SINGLE", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R1_MCQ_SINGLE"
        options={{ items: [{ label: "A", text: "Test" }, { label: "B", text: "Test B" }] }}
        correctAnswer={{ answer: "A" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Add Option")).toBeInTheDocument();
  });

  it("renders MCQEditor with checkboxes for R2_MCQ_MULTI", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R2_MCQ_MULTI"
        options={{
          items: [{ label: "A", text: "Test" }, { label: "B", text: "Test B" }],
          maxSelections: 2,
        }}
        correctAnswer={{ answers: ["A"] }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Max Selections")).toBeInTheDocument();
  });

  it("renders TFNGEditor for R3_TFNG", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R3_TFNG"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  it("renders TFNGEditor for R4_YNNG", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R4_YNNG"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("renders TextInputEditor for R5_SENTENCE_COMPLETION", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R5_SENTENCE_COMPLETION"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByPlaceholderText("Enter the correct answer...")).toBeInTheDocument();
  });

  it("renders TextInputEditor for R6_SHORT_ANSWER", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R6_SHORT_ANSWER"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByPlaceholderText("Enter the correct answer...")).toBeInTheDocument();
  });

  it("renders WordBankEditor for R7_SUMMARY_WORD_BANK", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R7_SUMMARY_WORD_BANK"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByPlaceholderText(/urban growth/i)).toBeInTheDocument();
  });

  it("renders TextInputEditor for R8_SUMMARY_PASSAGE", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R8_SUMMARY_PASSAGE"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByPlaceholderText("Enter the correct answer...")).toBeInTheDocument();
  });

  it("renders fallback for unimplemented types", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R9_MATCHING_HEADINGS"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/no editor available/i)).toBeInTheDocument();
  });
});

// --- Preview Components ---

describe("MCQPreview", () => {
  it("renders radio buttons for R1_MCQ_SINGLE", () => {
    render(
      <MCQPreview
        sectionType="R1_MCQ_SINGLE"
        questionText="What is the answer?"
        questionIndex={0}
        options={{
          items: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
          ],
        }}
      />,
    );
    expect(screen.getByText("What is the answer?")).toBeInTheDocument();
    expect(screen.getByText(/A\. Option A/)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("renders checkboxes for R2_MCQ_MULTI", () => {
    render(
      <MCQPreview
        sectionType="R2_MCQ_MULTI"
        questionText="Select two answers."
        questionIndex={1}
        options={{
          items: [
            { label: "A", text: "First" },
            { label: "B", text: "Second" },
          ],
          maxSelections: 2,
        }}
      />,
    );
    expect(screen.getByText("Select two answers.")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByText(/Choose 2 answers/)).toBeInTheDocument();
  });

  it("handles null options gracefully", () => {
    render(
      <MCQPreview
        sectionType="R1_MCQ_SINGLE"
        questionText="No options"
        questionIndex={0}
        options={null}
      />,
    );
    expect(screen.getByText("No options")).toBeInTheDocument();
  });
});

describe("TFNGPreview", () => {
  it("renders True/False/Not Given for R3_TFNG", () => {
    render(
      <TFNGPreview
        sectionType="R3_TFNG"
        questionText="The sky is blue."
        questionIndex={0}
      />,
    );
    expect(screen.getByText("The sky is blue.")).toBeInTheDocument();
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
    expect(screen.getByText("Not Given")).toBeInTheDocument();
  });

  it("renders Yes/No/Not Given for R4_YNNG", () => {
    render(
      <TFNGPreview
        sectionType="R4_YNNG"
        questionText="The author agrees."
        questionIndex={0}
      />,
    );
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("Not Given")).toBeInTheDocument();
  });
});

describe("TextInputPreview", () => {
  it("renders text input with word limit badge", () => {
    render(
      <TextInputPreview
        questionText="Complete the sentence."
        questionIndex={0}
        wordLimit={3}
      />,
    );
    expect(screen.getByText("Complete the sentence.")).toBeInTheDocument();
    expect(screen.getByText(/Max 3 words/)).toBeInTheDocument();
  });

  it("renders without word limit badge when null", () => {
    render(
      <TextInputPreview
        questionText="Answer the question."
        questionIndex={0}
        wordLimit={null}
      />,
    );
    expect(screen.getByText("Answer the question.")).toBeInTheDocument();
    expect(screen.queryByText(/Max/)).not.toBeInTheDocument();
  });
});

describe("WordBankPreview", () => {
  it("renders summary text with blanks", () => {
    render(
      <WordBankPreview
        questionIndex={0}
        options={{
          wordBank: ["climate", "population"],
          summaryText: "The ___1___ affects ___2___.",
        }}
      />,
    );
    expect(screen.getByText("The")).toBeInTheDocument();
    expect(screen.getByText("affects")).toBeInTheDocument();
  });

  it("handles null options gracefully", () => {
    render(
      <WordBankPreview questionIndex={0} options={null} />,
    );
    expect(screen.getByText("1.")).toBeInTheDocument();
  });
});

describe("QuestionPreviewFactory", () => {
  const baseQuestion = {
    id: "q1",
    sectionId: "s1",
    centerId: "c1",
    questionText: "Test question",
    questionType: "R1_MCQ_SINGLE",
    options: null,
    correctAnswer: null,
    orderIndex: 0,
    wordLimit: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("renders MCQPreview for R1_MCQ_SINGLE", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R1_MCQ_SINGLE"
        question={{
          ...baseQuestion,
          options: { items: [{ label: "A", text: "Opt A" }] },
        }}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("Test question")).toBeInTheDocument();
  });

  it("renders TFNGPreview for R3_TFNG", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R3_TFNG"
        question={baseQuestion}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  it("renders TextInputPreview for R5_SENTENCE_COMPLETION", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R5_SENTENCE_COMPLETION"
        question={baseQuestion}
        questionIndex={0}
      />,
    );
    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument();
  });

  it("renders WordBankPreview for R7_SUMMARY_WORD_BANK", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R7_SUMMARY_WORD_BANK"
        question={{
          ...baseQuestion,
          options: { wordBank: ["word1"], summaryText: "Text ___1___." },
        }}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("renders plain text fallback for unsupported types", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R9_MATCHING_HEADINGS"
        question={baseQuestion}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("Test question")).toBeInTheDocument();
  });
});
