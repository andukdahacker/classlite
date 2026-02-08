import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import { AnswerVariantManager } from "./AnswerVariantManager";
import { MCQEditor } from "./MCQEditor";
import { TFNGEditor } from "./TFNGEditor";
import { TextInputEditor } from "./TextInputEditor";
import { WordBankEditor } from "./WordBankEditor";
import { MatchingEditor } from "./MatchingEditor";
import { MatchingPreview } from "./MatchingPreview";
import { NoteTableFlowchartEditor } from "./NoteTableFlowchartEditor";
import { NoteTableFlowchartPreview } from "./NoteTableFlowchartPreview";
import { DiagramLabellingEditor } from "./DiagramLabellingEditor";
import { DiagramLabellingPreview } from "./DiagramLabellingPreview";
import { QuestionEditorFactory } from "./QuestionEditorFactory";
import { MCQPreview } from "./MCQPreview";
import { TFNGPreview } from "./TFNGPreview";
import { TextInputPreview } from "./TextInputPreview";
import { WordBankPreview } from "./WordBankPreview";
import { QuestionPreviewFactory } from "./QuestionPreviewFactory";

// Mock useDiagramUpload for DiagramLabellingEditor tests
vi.mock("../../hooks/use-diagram-upload", () => ({
  useDiagramUpload: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

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

// --- Story 3.5: TextInputEditor ---
describe("TextInputEditor", () => {
  it("renders correct answer input", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{
          answer: "revolution",
          acceptedVariants: ["revolt"],
          strictWordOrder: true,
        }}
        wordLimit={3}
        onChange={onChange}
      />,
    );
    expect(screen.getByDisplayValue("revolution")).toBeInTheDocument();
    expect(screen.getByText("revolt")).toBeInTheDocument();
  });

  it("adds a variant via AnswerVariantManager", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{
          answer: "answer",
          acceptedVariants: [],
          strictWordOrder: true,
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
          strictWordOrder: true,
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

  it("does NOT render caseSensitive checkbox (removed)", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{ answer: "test", acceptedVariants: [], strictWordOrder: true }}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    expect(screen.queryByText(/case.sensitive/i)).not.toBeInTheDocument();
  });

  it("shows word order toggle when answer has 2+ words", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{ answer: "carbon dioxide", acceptedVariants: [], strictWordOrder: true }}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/Allow any word order/)).toBeInTheDocument();
  });

  it("hides word order toggle for single-word answer", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{ answer: "cat", acceptedVariants: [], strictWordOrder: true }}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    expect(screen.queryByText(/Allow any word order/)).not.toBeInTheDocument();
  });

  it("uses onBlur for primary answer (not onChange per keystroke)", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{ answer: "test", acceptedVariants: [], strictWordOrder: true }}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    const input = screen.getByDisplayValue("test");
    fireEvent.change(input, { target: { value: "updated" } });
    // onChange should NOT be called on change — only on blur
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalled();
  });

  it("renders Paste variants button from AnswerVariantManager", () => {
    const onChange = vi.fn();
    render(
      <TextInputEditor
        correctAnswer={{ answer: "test", acceptedVariants: [], strictWordOrder: true }}
        wordLimit={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Paste variants")).toBeInTheDocument();
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

// --- MatchingEditor ---
// M3 note: Radix Select interaction (handleMatchAssignment) is not directly testable
// in jsdom because Radix relies on pointer events and portal rendering. The logic is
// exercised indirectly through the remove-item tests that verify match cleanup.
describe("MatchingEditor", () => {
  it("renders source and target items for R9", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{
          sourceItems: ["A", "B"],
          targetItems: ["Heading 1", "Heading 2", "Heading 3"],
        }}
        correctAnswer={{ matches: { A: "Heading 1" } }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Paragraphs")).toBeInTheDocument();
    expect(screen.getByText("Headings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("B")).toBeInTheDocument();
  });

  it("renders labels for R10_MATCHING_INFORMATION", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R10_MATCHING_INFORMATION"
        options={{
          sourceItems: ["Statement 1"],
          targetItems: ["A", "B"],
        }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Statements")).toBeInTheDocument();
    expect(screen.getByText("Paragraphs")).toBeInTheDocument();
  });

  it("renders labels for R11_MATCHING_FEATURES", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R11_MATCHING_FEATURES"
        options={{
          sourceItems: ["Dr. Smith"],
          targetItems: ["Theory X", "Theory Y"],
        }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("renders labels for R12_MATCHING_SENTENCE_ENDINGS", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R12_MATCHING_SENTENCE_ENDINGS"
        options={{
          sourceItems: ["The team found"],
          targetItems: ["it was true.", "it was false."],
        }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Sentence Beginnings")).toBeInTheDocument();
    expect(screen.getByText("Sentence Endings")).toBeInTheDocument();
  });

  it("adds a source item", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{ sourceItems: ["A"], targetItems: ["Heading 1", "Heading 2"] }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    const addInputs = screen.getAllByPlaceholderText(/Add paragraphs.../i);
    fireEvent.change(addInputs[0], { target: { value: "B" } });
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.sourceItems).toEqual(["A", "B"]);
  });

  it("adds a target item", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{ sourceItems: ["A"], targetItems: ["Heading 1"] }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    const addInputs = screen.getAllByPlaceholderText(/Add headings.../i);
    fireEvent.change(addInputs[0], { target: { value: "Heading 2" } });
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[addButtons.length - 1]);
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.targetItems).toEqual(["Heading 1", "Heading 2"]);
  });

  it("shows distractor warning when targets <= sources", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{ sourceItems: ["A", "B"], targetItems: ["Heading 1", "Heading 2"] }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/matching questions need extra choices/i)).toBeInTheDocument();
  });

  it("does not show distractor warning when targets > sources", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{ sourceItems: ["A", "B"], targetItems: ["H1", "H2", "H3"] }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.queryByText(/matching questions need extra choices/i)).not.toBeInTheDocument();
  });

  it("shows distractor count badge", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{ sourceItems: ["A", "B"], targetItems: ["H1", "H2", "H3", "H4"] }}
        correctAnswer={{ matches: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/4 headings, 2 to match/i)).toBeInTheDocument();
    expect(screen.getByText(/2 extra/i)).toBeInTheDocument();
  });

  it("handles null options gracefully", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Paragraphs")).toBeInTheDocument();
    expect(screen.getByText("Headings")).toBeInTheDocument();
  });

  it("removes a source item and cleans up matches for index-based types", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R10_MATCHING_INFORMATION"
        options={{
          sourceItems: ["Statement 1", "Statement 2", "Statement 3"],
          targetItems: ["A", "B", "C", "D"],
        }}
        correctAnswer={{ matches: { "0": "A", "1": "B", "2": "C" } }}
        onChange={onChange}
      />,
    );
    // Remove the first source item
    const removeButtons = screen.getAllByLabelText(/remove statements item/i);
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const [options, answer] = onChange.mock.calls[0];
    expect(options.sourceItems).toEqual(["Statement 2", "Statement 3"]);
    // Keys should be re-indexed: old "1" -> "0", old "2" -> "1"
    expect(answer.matches).toEqual({ "0": "B", "1": "C" });
  });

  it("removes a target item and cleans up matches referencing it", () => {
    const onChange = vi.fn();
    render(
      <MatchingEditor
        sectionType="R9_MATCHING_HEADINGS"
        options={{
          sourceItems: ["A", "B"],
          targetItems: ["Heading 1", "Heading 2", "Heading 3"],
        }}
        correctAnswer={{ matches: { A: "Heading 1", B: "Heading 2" } }}
        onChange={onChange}
      />,
    );
    // Remove "Heading 1" (first target item)
    const removeButtons = screen.getAllByLabelText(/remove headings item/i);
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const [options, answer] = onChange.mock.calls[0];
    expect(options.targetItems).toEqual(["Heading 2", "Heading 3"]);
    // Match "A" -> "Heading 1" should be cleaned up
    expect(answer.matches).toEqual({ B: "Heading 2" });
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

  it("renders MatchingEditor for R9_MATCHING_HEADINGS", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R9_MATCHING_HEADINGS"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Paragraphs")).toBeInTheDocument();
    expect(screen.getByText("Headings")).toBeInTheDocument();
  });

  it("renders MatchingEditor for R10_MATCHING_INFORMATION", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R10_MATCHING_INFORMATION"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Statements")).toBeInTheDocument();
    expect(screen.getByText("Paragraphs")).toBeInTheDocument();
  });

  it("renders MatchingEditor for R11_MATCHING_FEATURES", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R11_MATCHING_FEATURES"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("renders MatchingEditor for R12_MATCHING_SENTENCE_ENDINGS", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R12_MATCHING_SENTENCE_ENDINGS"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Sentence Beginnings")).toBeInTheDocument();
    expect(screen.getByText("Sentence Endings")).toBeInTheDocument();
  });

  it("renders NoteTableFlowchartEditor for R13_NOTE_TABLE_FLOWCHART", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R13_NOTE_TABLE_FLOWCHART"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Sub-Format")).toBeInTheDocument();
  });

  it("renders DiagramLabellingEditor for R14_DIAGRAM_LABELLING", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="R14_DIAGRAM_LABELLING"
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Diagram Image")).toBeInTheDocument();
  });

  it("renders fallback for truly unimplemented types", () => {
    const onChange = vi.fn();
    render(
      <QuestionEditorFactory
        sectionType="L1_FORM_NOTE_TABLE"
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

// --- MatchingPreview ---
describe("MatchingPreview", () => {
  it("renders R9 preview with paragraph labels and disabled dropdowns", () => {
    render(
      <MatchingPreview
        sectionType="R9_MATCHING_HEADINGS"
        questionIndex={0}
        options={{
          sourceItems: ["A", "B"],
          targetItems: ["Heading 1", "Heading 2", "Heading 3"],
        }}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders R10 preview with statements", () => {
    render(
      <MatchingPreview
        sectionType="R10_MATCHING_INFORMATION"
        questionIndex={0}
        options={{
          sourceItems: ["Statement 1"],
          targetItems: ["A", "B"],
        }}
      />,
    );
    expect(screen.getByText("Statement 1")).toBeInTheDocument();
  });

  it("renders R11 preview with items", () => {
    render(
      <MatchingPreview
        sectionType="R11_MATCHING_FEATURES"
        questionIndex={0}
        options={{
          sourceItems: ["Dr. Smith", "Prof. Jones"],
          targetItems: ["Theory X", "Theory Y"],
        }}
      />,
    );
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    expect(screen.getByText("Prof. Jones")).toBeInTheDocument();
  });

  it("renders R12 preview with sentence beginnings", () => {
    render(
      <MatchingPreview
        sectionType="R12_MATCHING_SENTENCE_ENDINGS"
        questionIndex={0}
        options={{
          sourceItems: ["The team found"],
          targetItems: ["it was true.", "it was false."],
        }}
      />,
    );
    expect(screen.getByText("The team found")).toBeInTheDocument();
  });

  it("handles null options gracefully with empty-state message", () => {
    render(
      <MatchingPreview
        sectionType="R9_MATCHING_HEADINGS"
        questionIndex={0}
        options={null}
      />,
    );
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("No matching items configured.")).toBeInTheDocument();
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

  it("renders MatchingPreview for R9_MATCHING_HEADINGS", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R9_MATCHING_HEADINGS"
        question={{
          ...baseQuestion,
          options: {
            sourceItems: ["A", "B"],
            targetItems: ["Heading 1", "Heading 2", "Heading 3"],
          },
        }}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders MatchingPreview for R10_MATCHING_INFORMATION", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R10_MATCHING_INFORMATION"
        question={{
          ...baseQuestion,
          options: {
            sourceItems: ["Statement 1"],
            targetItems: ["A", "B"],
          },
        }}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("Statement 1")).toBeInTheDocument();
  });

  it("renders NoteTableFlowchartPreview for R13_NOTE_TABLE_FLOWCHART", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R13_NOTE_TABLE_FLOWCHART"
        question={{
          ...baseQuestion,
          options: {
            subFormat: "note",
            structure: "Main Topic\n• Impact ___1___",
            wordLimit: 2,
          },
        }}
        questionIndex={0}
      />,
    );
    expect(screen.getByText(/Main Topic/)).toBeInTheDocument();
  });

  it("renders NoteTableFlowchartPreview empty state for R13 with null options", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R13_NOTE_TABLE_FLOWCHART"
        question={baseQuestion}
        questionIndex={0}
      />,
    );
    expect(screen.getByText(/No structure configured/i)).toBeInTheDocument();
  });

  it("renders DiagramLabellingPreview for R14_DIAGRAM_LABELLING", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R14_DIAGRAM_LABELLING"
        question={{
          ...baseQuestion,
          options: {
            diagramUrl: "",
            labelPositions: ["outer shell", "membrane"],
            wordLimit: 2,
          },
        }}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("outer shell")).toBeInTheDocument();
    expect(screen.getByText("membrane")).toBeInTheDocument();
  });

  it("renders DiagramLabellingPreview empty state for R14 with null options", () => {
    render(
      <QuestionPreviewFactory
        sectionType="R14_DIAGRAM_LABELLING"
        question={baseQuestion}
        questionIndex={0}
      />,
    );
    expect(screen.getByText(/No diagram configured/i)).toBeInTheDocument();
  });

  it("renders plain text fallback for unsupported types", () => {
    render(
      <QuestionPreviewFactory
        sectionType="L1_FORM_NOTE_TABLE"
        question={baseQuestion}
        questionIndex={0}
      />,
    );
    expect(screen.getByText("Test question")).toBeInTheDocument();
  });
});

// --- NoteTableFlowchartEditor ---
describe("NoteTableFlowchartEditor", () => {
  it("renders sub-format selector with note as default", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Sub-Format")).toBeInTheDocument();
    expect(screen.getByText("note")).toBeInTheDocument();
    expect(screen.getByText("table")).toBeInTheDocument();
    expect(screen.getByText("flowchart")).toBeInTheDocument();
  });

  it("renders note mode textarea", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={{
          subFormat: "note",
          structure: "Topic\n• Point ___1___",
          wordLimit: 2,
        }}
        correctAnswer={{ blanks: { "1": { answer: "answer", acceptedVariants: [], strictWordOrder: true } } }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/Structured Text/)).toBeInTheDocument();
    expect(screen.getByText("Blank 1:")).toBeInTheDocument();
  });

  it("renders table mode grid", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={{
          subFormat: "table",
          structure: JSON.stringify({
            columns: ["Country", "Population"],
            rows: [["Vietnam", "___1___"]],
          }),
          wordLimit: 2,
        }}
        correctAnswer={{ blanks: { "1": { answer: "98 million", acceptedVariants: [], strictWordOrder: true } } }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Table Structure")).toBeInTheDocument();
    expect(screen.getByText("Blank 1:")).toBeInTheDocument();
  });

  it("renders flowchart mode steps", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={{
          subFormat: "flowchart",
          structure: JSON.stringify({
            steps: ["Step ___1___", "Step ___2___"],
          }),
          wordLimit: 2,
        }}
        correctAnswer={{ blanks: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/Flowchart Steps/)).toBeInTheDocument();
    expect(screen.getByText("Blank 1:")).toBeInTheDocument();
    expect(screen.getByText("Blank 2:")).toBeInTheDocument();
  });

  it("renders word limit control", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={{ subFormat: "note", structure: "text", wordLimit: 3 }}
        correctAnswer={{ blanks: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByText("words")).toBeInTheDocument();
  });

  it("handles null options gracefully", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Sub-Format")).toBeInTheDocument();
    expect(screen.getByText("Word Limit")).toBeInTheDocument();
  });

  it("switches sub-format and calls onChange", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={{ subFormat: "note", structure: "text", wordLimit: 2 }}
        correctAnswer={{ blanks: {} }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("table"));
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.subFormat).toBe("table");
  });

  it("handles malformed table JSON gracefully", () => {
    const onChange = vi.fn();
    render(
      <NoteTableFlowchartEditor
        options={{ subFormat: "table", structure: "not json", wordLimit: 2 }}
        correctAnswer={{ blanks: {} }}
        onChange={onChange}
      />,
    );
    // Should render table editor without crashing
    expect(screen.getByText("Table Structure")).toBeInTheDocument();
  });
});

// --- NoteTableFlowchartPreview ---
describe("NoteTableFlowchartPreview", () => {
  it("renders note preview with blanks", () => {
    render(
      <NoteTableFlowchartPreview
        questionIndex={0}
        options={{
          subFormat: "note",
          structure: "Topic\n• Impact ___1___",
          wordLimit: 2,
        }}
      />,
    );
    expect(screen.getByText("Topic")).toBeInTheDocument();
    expect(screen.getByText("2w")).toBeInTheDocument();
  });

  it("renders table preview", () => {
    render(
      <NoteTableFlowchartPreview
        questionIndex={0}
        options={{
          subFormat: "table",
          structure: JSON.stringify({
            columns: ["Country", "Pop"],
            rows: [["Vietnam", "___1___"]],
          }),
          wordLimit: 3,
        }}
      />,
    );
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Pop")).toBeInTheDocument();
    expect(screen.getByText("Vietnam")).toBeInTheDocument();
    expect(screen.getByText("3w")).toBeInTheDocument();
  });

  it("renders flowchart preview", () => {
    render(
      <NoteTableFlowchartPreview
        questionIndex={0}
        options={{
          subFormat: "flowchart",
          structure: JSON.stringify({ steps: ["Seeds in ___1___", "Grow ___2___"] }),
          wordLimit: 2,
        }}
      />,
    );
    expect(screen.getByText("Seeds in")).toBeInTheDocument();
    expect(screen.getAllByText("2w")).toHaveLength(2);
  });

  it("renders empty state when options is null", () => {
    render(
      <NoteTableFlowchartPreview questionIndex={0} options={null} />,
    );
    expect(screen.getByText(/No structure configured/i)).toBeInTheDocument();
  });

  it("shows invalid table message for malformed JSON", () => {
    render(
      <NoteTableFlowchartPreview
        questionIndex={0}
        options={{
          subFormat: "table",
          structure: "not json",
        }}
      />,
    );
    expect(screen.getByText(/Invalid table structure/i)).toBeInTheDocument();
  });
});

// --- DiagramLabellingPreview ---
describe("DiagramLabellingPreview", () => {
  it("renders label positions without word bank", () => {
    render(
      <DiagramLabellingPreview
        questionIndex={0}
        options={{
          diagramUrl: "",
          labelPositions: ["outer shell", "membrane"],
          wordLimit: 2,
        }}
      />,
    );
    expect(screen.getByText("outer shell")).toBeInTheDocument();
    expect(screen.getByText("membrane")).toBeInTheDocument();
    expect(screen.getAllByText("2w")).toHaveLength(2);
    expect(screen.getByText(/No diagram uploaded/i)).toBeInTheDocument();
  });

  it("renders diagram image when URL provided", () => {
    render(
      <DiagramLabellingPreview
        questionIndex={0}
        options={{
          diagramUrl: "https://example.com/diagram.png",
          labelPositions: ["shell"],
          wordLimit: 2,
        }}
      />,
    );
    const img = screen.getByAltText("Diagram");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/diagram.png");
  });

  it("renders distractor badge with word bank", () => {
    render(
      <DiagramLabellingPreview
        questionIndex={0}
        options={{
          diagramUrl: "",
          labelPositions: ["Pos 1", "Pos 2"],
          wordBank: ["shell", "membrane", "air cell", "yolk"],
          wordLimit: 2,
        }}
      />,
    );
    expect(screen.getByText(/4 labels, 2 positions/)).toBeInTheDocument();
    expect(screen.getByText(/2 distractors/)).toBeInTheDocument();
  });

  it("renders empty state when options is null", () => {
    render(
      <DiagramLabellingPreview questionIndex={0} options={null} />,
    );
    expect(screen.getByText(/No diagram configured/i)).toBeInTheDocument();
  });
});

// --- DiagramLabellingEditor ---
describe("DiagramLabellingEditor", () => {
  it("renders upload prompt when no diagram URL", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Diagram Image")).toBeInTheDocument();
    expect(screen.getByText("Upload Diagram")).toBeInTheDocument();
  });

  it("renders label positions and correct label inputs", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["outer shell", "membrane"],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: { "0": { answer: "answer1", acceptedVariants: [], strictWordOrder: true } } }}
        onChange={onChange}
      />,
    );
    // Label position inputs
    expect(screen.getByDisplayValue("outer shell")).toBeInTheDocument();
    expect(screen.getByDisplayValue("membrane")).toBeInTheDocument();
    // Correct answer input
    expect(screen.getByDisplayValue("answer1")).toBeInTheDocument();
  });

  it("adds a label position", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["Position 1"],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: {} }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("Add Position"));
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.labelPositions).toHaveLength(2);
    expect(options.labelPositions[1]).toBe("Position 2");
  });

  it("removes a label position and re-indexes labels", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["shell", "membrane", "yolk"],
          wordBank: ["shell", "membrane", "yolk", "albumen"],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: { "0": "shell", "1": "membrane", "2": "yolk" } }}
        onChange={onChange}
      />,
    );
    const removeButtons = screen.getAllByLabelText("Remove position");
    // Remove the first position
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalled();
    const [options, answer] = onChange.mock.calls[0];
    expect(options.labelPositions).toEqual(["membrane", "yolk"]);
    // Labels should be re-indexed: old "1" -> "0", old "2" -> "1"
    expect(answer.labels).toEqual({ "0": "membrane", "1": "yolk" });
  });

  it("toggles word bank on and off", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["Position 1"],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: {} }}
        onChange={onChange}
      />,
    );
    // Toggle word bank on
    fireEvent.click(screen.getByLabelText("Use Word Bank"));
    expect(onChange).toHaveBeenCalled();
    const [options] = onChange.mock.calls[0];
    expect(options.wordBank).toEqual([]);
  });

  it("shows word limit only when word bank is not used", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["Position 1"],
          wordLimit: 3,
        }}
        correctAnswer={{ labels: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Word Limit")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("hides word limit when word bank is used", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["Position 1"],
          wordBank: ["shell", "membrane"],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.queryByText("Word Limit")).not.toBeInTheDocument();
  });

  it("handles null options gracefully", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={null}
        correctAnswer={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Diagram Image")).toBeInTheDocument();
    expect(screen.getByText("Add Position")).toBeInTheDocument();
  });

  it("shows diagram image when URL is provided", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "https://example.com/diagram.png",
          labelPositions: [],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: {} }}
        onChange={onChange}
      />,
    );
    const img = screen.getByAltText("Diagram");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/diagram.png");
  });

  it("shows distractor badge when word bank has more items than positions", () => {
    const onChange = vi.fn();
    render(
      <DiagramLabellingEditor
        options={{
          diagramUrl: "",
          labelPositions: ["Pos 1", "Pos 2"],
          wordBank: ["shell", "membrane", "air cell", "yolk"],
          wordLimit: 2,
        }}
        correctAnswer={{ labels: {} }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/4 labels, 2 positions/)).toBeInTheDocument();
    expect(screen.getByText(/2 distractors/)).toBeInTheDocument();
  });
});

// --- Story 3.5 Task 12.1: AnswerVariantManager ---
describe("AnswerVariantManager", () => {
  it("renders variant chips", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={["nineteen", "19"]}
        onVariantsChange={onVariantsChange}
      />,
    );
    expect(screen.getByText("nineteen")).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
  });

  it("adds a variant via input", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={["existing"]}
        onVariantsChange={onVariantsChange}
      />,
    );
    const input = screen.getByPlaceholderText("Add accepted variant...");
    fireEvent.change(input, { target: { value: "new" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onVariantsChange).toHaveBeenCalled();
    const newVariants = onVariantsChange.mock.calls[0][0];
    expect(newVariants).toContain("new");
    expect(newVariants).toContain("existing");
  });

  it("removes a variant", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={["alpha", "beta"]}
        onVariantsChange={onVariantsChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Remove variant alpha"));
    expect(onVariantsChange).toHaveBeenCalledWith(["beta"]);
  });

  it("rejects empty input", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={[]}
        onVariantsChange={onVariantsChange}
      />,
    );
    fireEvent.click(screen.getByText("Add"));
    expect(onVariantsChange).not.toHaveBeenCalled();
  });

  it("deduplicates on add", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={["existing"]}
        onVariantsChange={onVariantsChange}
      />,
    );
    const input = screen.getByPlaceholderText("Add accepted variant...");
    fireEvent.change(input, { target: { value: "existing" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onVariantsChange).not.toHaveBeenCalled();
  });

  it("renders empty state", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={[]}
        onVariantsChange={onVariantsChange}
      />,
    );
    expect(screen.getByText("Accepted Variants")).toBeInTheDocument();
    expect(screen.getByText("Paste variants")).toBeInTheDocument();
  });

  it("shows paste variants popover", () => {
    const onVariantsChange = vi.fn();
    render(
      <AnswerVariantManager
        variants={[]}
        onVariantsChange={onVariantsChange}
      />,
    );
    fireEvent.click(screen.getByText("Paste variants"));
    expect(screen.getByPlaceholderText("e.g. 19, nineteen, Nineteen")).toBeInTheDocument();
  });
});
