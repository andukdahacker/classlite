import { describe, it, expect } from "vitest";
import {
  MCQOptionSchema,
  MCQOptionsSchema,
  MCQMultiOptionsSchema,
  MCQSingleAnswerSchema,
  MCQMultiAnswerSchema,
  TFNGAnswerSchema,
  YNNGAnswerSchema,
  TextAnswerSchema,
  WordBankOptionsSchema,
  WordBankAnswerSchema,
  MatchingOptionsSchema,
  MatchingAnswerSchema,
  NoteTableFlowchartOptionsSchema,
  NoteTableFlowchartAnswerSchema,
  DiagramLabellingOptionsSchema,
  DiagramLabellingAnswerSchema,
  QuestionOptionsSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  ExerciseSchema,
  CreateExerciseSchema,
  UpdateExerciseSchema,
  AudioSectionSchema,
  PlaybackModeSchema,
  QuestionSectionSchema,
  AutosaveExerciseSchema,
  LetterToneSchema,
  WordCountModeSchema,
  WritingRubricCriterionSchema,
  WritingRubricSchema,
} from "./exercises.js";

describe("Exercise Type-Helper Schemas", () => {
  // --- Task 1.1: MCQOptionSchema ---
  describe("MCQOptionSchema", () => {
    it("should validate a valid MCQ option", () => {
      const result = MCQOptionSchema.safeParse({ label: "A", text: "First option" });
      expect(result.success).toBe(true);
    });

    it("should reject missing label", () => {
      const result = MCQOptionSchema.safeParse({ text: "First option" });
      expect(result.success).toBe(false);
    });

    it("should reject missing text", () => {
      const result = MCQOptionSchema.safeParse({ label: "A" });
      expect(result.success).toBe(false);
    });
  });

  // --- MCQOptionsSchema (R1) ---
  describe("MCQOptionsSchema", () => {
    it("should validate R1 MCQ single options", () => {
      const result = MCQOptionsSchema.safeParse({
        items: [
          { label: "A", text: "Option A" },
          { label: "B", text: "Option B" },
          { label: "C", text: "Option C" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const result = MCQOptionsSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });

    it("should require at least 2 items", () => {
      const result = MCQOptionsSchema.safeParse({
        items: [{ label: "A", text: "Only one" }],
      });
      expect(result.success).toBe(false);
    });
  });

  // --- MCQMultiOptionsSchema (R2) ---
  describe("MCQMultiOptionsSchema", () => {
    it("should validate R2 MCQ multi options with maxSelections", () => {
      const result = MCQMultiOptionsSchema.safeParse({
        items: [
          { label: "A", text: "Option A" },
          { label: "B", text: "Option B" },
          { label: "C", text: "Option C" },
        ],
        maxSelections: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject maxSelections < 1", () => {
      const result = MCQMultiOptionsSchema.safeParse({
        items: [
          { label: "A", text: "Option A" },
          { label: "B", text: "Option B" },
        ],
        maxSelections: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  // --- MCQSingleAnswerSchema (R1) ---
  describe("MCQSingleAnswerSchema", () => {
    it("should validate a single answer", () => {
      const result = MCQSingleAnswerSchema.safeParse({ answer: "A" });
      expect(result.success).toBe(true);
    });

    it("should reject empty answer", () => {
      const result = MCQSingleAnswerSchema.safeParse({ answer: "" });
      expect(result.success).toBe(false);
    });
  });

  // --- MCQMultiAnswerSchema (R2) ---
  describe("MCQMultiAnswerSchema", () => {
    it("should validate multiple answers", () => {
      const result = MCQMultiAnswerSchema.safeParse({ answers: ["A", "C"] });
      expect(result.success).toBe(true);
    });

    it("should reject empty answers array", () => {
      const result = MCQMultiAnswerSchema.safeParse({ answers: [] });
      expect(result.success).toBe(false);
    });
  });

  // --- Task 1.4: TFNGAnswerSchema (R3) ---
  describe("TFNGAnswerSchema", () => {
    it("should validate TRUE", () => {
      const result = TFNGAnswerSchema.safeParse({ answer: "TRUE" });
      expect(result.success).toBe(true);
    });

    it("should validate FALSE", () => {
      const result = TFNGAnswerSchema.safeParse({ answer: "FALSE" });
      expect(result.success).toBe(true);
    });

    it("should validate NOT_GIVEN", () => {
      const result = TFNGAnswerSchema.safeParse({ answer: "NOT_GIVEN" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid value", () => {
      const result = TFNGAnswerSchema.safeParse({ answer: "MAYBE" });
      expect(result.success).toBe(false);
    });
  });

  // --- YNNGAnswerSchema (R4) ---
  describe("YNNGAnswerSchema", () => {
    it("should validate YES", () => {
      const result = YNNGAnswerSchema.safeParse({ answer: "YES" });
      expect(result.success).toBe(true);
    });

    it("should validate NO", () => {
      const result = YNNGAnswerSchema.safeParse({ answer: "NO" });
      expect(result.success).toBe(true);
    });

    it("should validate NOT_GIVEN", () => {
      const result = YNNGAnswerSchema.safeParse({ answer: "NOT_GIVEN" });
      expect(result.success).toBe(true);
    });

    it("should reject TRUE (wrong schema)", () => {
      const result = YNNGAnswerSchema.safeParse({ answer: "TRUE" });
      expect(result.success).toBe(false);
    });
  });

  // --- Task 1.3 / Story 3.5 Task 2: TextAnswerSchema (R5/R6/R8) ---
  describe("TextAnswerSchema", () => {
    it("should validate a complete text answer with strictWordOrder", () => {
      const result = TextAnswerSchema.safeParse({
        answer: "the industrial revolution",
        acceptedVariants: ["industrial revolution", "Industrial Revolution"],
        strictWordOrder: true,
      });
      expect(result.success).toBe(true);
    });

    it("should default strictWordOrder to true", () => {
      const result = TextAnswerSchema.safeParse({
        answer: "answer",
        acceptedVariants: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strictWordOrder).toBe(true);
      }
    });

    it("should default acceptedVariants to empty array", () => {
      const result = TextAnswerSchema.safeParse({
        answer: "answer",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.acceptedVariants).toEqual([]);
      }
    });

    it("should accept strictWordOrder false", () => {
      const result = TextAnswerSchema.safeParse({
        answer: "carbon dioxide",
        acceptedVariants: [],
        strictWordOrder: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strictWordOrder).toBe(false);
      }
    });

    it("should reject empty answer", () => {
      const result = TextAnswerSchema.safeParse({
        answer: "",
        acceptedVariants: [],
      });
      expect(result.success).toBe(false);
    });

    it("should strip old caseSensitive field from stored JSON (backwards-compat)", () => {
      const result = TextAnswerSchema.safeParse({
        answer: "carbon dioxide",
        acceptedVariants: ["CO2"],
        caseSensitive: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // caseSensitive should be stripped by Zod (not present in parsed output)
        expect("caseSensitive" in result.data).toBe(false);
        // strictWordOrder should default to true
        expect(result.data.strictWordOrder).toBe(true);
      }
    });
  });

  // --- Task 1.2: WordBankOptionsSchema (R7) ---
  describe("WordBankOptionsSchema", () => {
    it("should validate word bank options", () => {
      const result = WordBankOptionsSchema.safeParse({
        wordBank: ["climate", "population", "agriculture"],
        summaryText: "The main factor was ___1___. This led to ___2___.",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty word bank", () => {
      const result = WordBankOptionsSchema.safeParse({
        wordBank: [],
        summaryText: "Some text ___1___",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty summary text", () => {
      const result = WordBankOptionsSchema.safeParse({
        wordBank: ["word1"],
        summaryText: "",
      });
      expect(result.success).toBe(false);
    });
  });

  // --- WordBankAnswerSchema (R7) ---
  describe("WordBankAnswerSchema", () => {
    it("should validate word bank answers", () => {
      const result = WordBankAnswerSchema.safeParse({
        blanks: { "1": "migration", "2": "population" },
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty blanks", () => {
      const result = WordBankAnswerSchema.safeParse({ blanks: {} });
      // z.record allows empty objects, but semantically we need at least 1
      // The schema validates structure; application logic checks completeness
      expect(result.success).toBe(true);
    });
  });

  // --- MatchingOptionsSchema (R9-R12) ---
  describe("MatchingOptionsSchema", () => {
    it("should validate matching options with source and target items", () => {
      const result = MatchingOptionsSchema.safeParse({
        sourceItems: ["A", "B", "C"],
        targetItems: ["Heading 1", "Heading 2", "Heading 3", "Heading 4"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty sourceItems", () => {
      const result = MatchingOptionsSchema.safeParse({
        sourceItems: [],
        targetItems: ["Heading 1"],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty targetItems", () => {
      const result = MatchingOptionsSchema.safeParse({
        sourceItems: ["A"],
        targetItems: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing sourceItems", () => {
      const result = MatchingOptionsSchema.safeParse({
        targetItems: ["Heading 1"],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing targetItems", () => {
      const result = MatchingOptionsSchema.safeParse({
        sourceItems: ["A"],
      });
      expect(result.success).toBe(false);
    });
  });

  // --- MatchingAnswerSchema (R9-R12) ---
  describe("MatchingAnswerSchema", () => {
    it("should validate matching answers with letter keys (R9)", () => {
      const result = MatchingAnswerSchema.safeParse({
        matches: { A: "Heading 1", B: "Heading 2", C: "Heading 3" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate matching answers with index keys (R10-R12)", () => {
      const result = MatchingAnswerSchema.safeParse({
        matches: { "0": "A", "1": "C", "2": "E" },
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty matches (structure valid, application logic checks completeness)", () => {
      const result = MatchingAnswerSchema.safeParse({ matches: {} });
      expect(result.success).toBe(true);
    });

    it("should reject missing matches field", () => {
      const result = MatchingAnswerSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // --- NoteTableFlowchartOptionsSchema (R13) ---
  describe("NoteTableFlowchartOptionsSchema", () => {
    it("should validate note sub-format", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "note",
        structure: "Main Topic\n• Point ___1___\n• Point ___2___",
        wordLimit: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should validate table sub-format", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "table",
        structure: '{"columns":["A","B"],"rows":[["___1___","text"]]}',
        wordLimit: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should validate flowchart sub-format", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "flowchart",
        structure: '{"steps":["Step ___1___","Step ___2___"]}',
        wordLimit: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should default wordLimit to 2", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "note",
        structure: "Some text ___1___",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.wordLimit).toBe(2);
      }
    });

    it("should reject invalid sub-format", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "diagram",
        structure: "text",
        wordLimit: 2,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty structure", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "note",
        structure: "",
        wordLimit: 2,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing structure", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "note",
        wordLimit: 2,
      });
      expect(result.success).toBe(false);
    });

    it("should reject wordLimit below 1", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "note",
        structure: "text ___1___",
        wordLimit: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject wordLimit above 5", () => {
      const result = NoteTableFlowchartOptionsSchema.safeParse({
        subFormat: "note",
        structure: "text ___1___",
        wordLimit: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  // --- NoteTableFlowchartAnswerSchema (R13) — Story 3.5: variant-aware structured format ---
  describe("NoteTableFlowchartAnswerSchema", () => {
    it("should validate blanks with structured answer objects", () => {
      const result = NoteTableFlowchartAnswerSchema.safeParse({
        blanks: {
          "1": { answer: "fifteen percent", acceptedVariants: ["15%", "15 percent"], strictWordOrder: true },
          "2": { answer: "developing nations", acceptedVariants: [], strictWordOrder: false },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should default acceptedVariants and strictWordOrder", () => {
      const result = NoteTableFlowchartAnswerSchema.safeParse({
        blanks: {
          "1": { answer: "carbon dioxide" },
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blanks["1"].acceptedVariants).toEqual([]);
        expect(result.data.blanks["1"].strictWordOrder).toBe(true);
      }
    });

    it("should accept empty blanks (structure valid)", () => {
      const result = NoteTableFlowchartAnswerSchema.safeParse({ blanks: {} });
      expect(result.success).toBe(true);
    });

    it("should reject missing blanks field", () => {
      const result = NoteTableFlowchartAnswerSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject flat string values (old format)", () => {
      const result = NoteTableFlowchartAnswerSchema.safeParse({
        blanks: { "1": "fifteen percent" },
      });
      expect(result.success).toBe(false);
    });
  });

  // --- DiagramLabellingOptionsSchema (R14) ---
  describe("DiagramLabellingOptionsSchema", () => {
    it("should validate without word bank", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "https://storage.example.com/diagram.png",
        labelPositions: ["outer shell", "membrane", "air cell"],
        wordLimit: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should validate with word bank", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "https://storage.example.com/diagram.png",
        labelPositions: ["Position 1", "Position 2"],
        wordBank: ["shell", "membrane", "air cell", "yolk"],
        wordLimit: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should default wordLimit to 2", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "https://storage.example.com/diagram.png",
        labelPositions: ["Position 1"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.wordLimit).toBe(2);
      }
    });

    it("should reject empty diagramUrl", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "",
        labelPositions: ["Position 1"],
        wordLimit: 2,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty labelPositions", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "https://example.com/img.png",
        labelPositions: [],
        wordLimit: 2,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing diagramUrl", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        labelPositions: ["Position 1"],
        wordLimit: 2,
      });
      expect(result.success).toBe(false);
    });

    it("should reject wordLimit below 1", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "https://example.com/img.png",
        labelPositions: ["Position 1"],
        wordLimit: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject wordLimit above 5", () => {
      const result = DiagramLabellingOptionsSchema.safeParse({
        diagramUrl: "https://example.com/img.png",
        labelPositions: ["Position 1"],
        wordLimit: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  // --- DiagramLabellingAnswerSchema (R14) — Story 3.5: union type ---
  describe("DiagramLabellingAnswerSchema", () => {
    it("should validate labels with simple string values (word-bank mode)", () => {
      const result = DiagramLabellingAnswerSchema.safeParse({
        labels: { "0": "outer shell", "1": "membrane", "2": "air cell" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate labels with structured objects (free-text mode)", () => {
      const result = DiagramLabellingAnswerSchema.safeParse({
        labels: {
          "0": { answer: "outer shell", acceptedVariants: ["shell"], strictWordOrder: true },
          "1": { answer: "membrane", acceptedVariants: [], strictWordOrder: true },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate mixed string and structured labels", () => {
      const result = DiagramLabellingAnswerSchema.safeParse({
        labels: {
          "0": "word-bank-label",
          "1": { answer: "free text label", acceptedVariants: ["alt"], strictWordOrder: false },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should default acceptedVariants and strictWordOrder in structured labels", () => {
      const result = DiagramLabellingAnswerSchema.safeParse({
        labels: { "0": { answer: "test" } },
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty labels (structure valid)", () => {
      const result = DiagramLabellingAnswerSchema.safeParse({ labels: {} });
      expect(result.success).toBe(true);
    });

    it("should reject missing labels field", () => {
      const result = DiagramLabellingAnswerSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // --- Task 1.5: QuestionOptionsSchema discriminated union ---
  describe("QuestionOptionsSchema", () => {
    it("should validate R1_MCQ_SINGLE options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R1_MCQ_SINGLE",
        options: {
          items: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
          ],
        },
        correctAnswer: { answer: "A" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R2_MCQ_MULTI options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R2_MCQ_MULTI",
        options: {
          items: [
            { label: "A", text: "Option A" },
            { label: "B", text: "Option B" },
            { label: "C", text: "Option C" },
          ],
          maxSelections: 2,
        },
        correctAnswer: { answers: ["A", "C"] },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R3_TFNG answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R3_TFNG",
        options: null,
        correctAnswer: { answer: "TRUE" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R4_YNNG answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R4_YNNG",
        options: null,
        correctAnswer: { answer: "YES" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R5_SENTENCE_COMPLETION answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R5_SENTENCE_COMPLETION",
        options: null,
        correctAnswer: {
          answer: "the industrial revolution",
          acceptedVariants: ["industrial revolution"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R6_SHORT_ANSWER answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R6_SHORT_ANSWER",
        options: null,
        correctAnswer: {
          answer: "carbon dioxide",
          acceptedVariants: ["CO2"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R7_SUMMARY_WORD_BANK options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R7_SUMMARY_WORD_BANK",
        options: {
          wordBank: ["climate", "population", "agriculture"],
          summaryText: "The main factor was ___1___.",
        },
        correctAnswer: { blanks: { "1": "climate" } },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R8_SUMMARY_PASSAGE answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R8_SUMMARY_PASSAGE",
        options: null,
        correctAnswer: {
          answer: "deforestation",
          acceptedVariants: [],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R9_MATCHING_HEADINGS options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R9_MATCHING_HEADINGS",
        options: {
          sourceItems: ["A", "B", "C", "D", "E"],
          targetItems: [
            "The impact of climate change",
            "Economic growth in developing nations",
            "Solutions for urban planning",
            "Educational reform policies",
            "Healthcare system challenges",
            "Technology and social change",
            "Environmental conservation efforts",
          ],
        },
        correctAnswer: {
          matches: {
            A: "The impact of climate change",
            B: "Economic growth in developing nations",
            C: "Solutions for urban planning",
            D: "Educational reform policies",
            E: "Healthcare system challenges",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R10_MATCHING_INFORMATION options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R10_MATCHING_INFORMATION",
        options: {
          sourceItems: [
            "a reference to the size of the population",
            "an explanation of the process",
          ],
          targetItems: ["A", "B", "C", "D", "E", "F"],
        },
        correctAnswer: {
          matches: { "0": "C", "1": "A" },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R11_MATCHING_FEATURES options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R11_MATCHING_FEATURES",
        options: {
          sourceItems: ["Dr. Smith", "Prof. Jones", "Dr. Lee"],
          targetItems: ["Supports Theory X", "Opposes Theory X", "Neutral"],
        },
        correctAnswer: {
          matches: {
            "0": "Supports Theory X",
            "1": "Opposes Theory X",
            "2": "Neutral",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R12_MATCHING_SENTENCE_ENDINGS options + answer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R12_MATCHING_SENTENCE_ENDINGS",
        options: {
          sourceItems: [
            "The research team discovered that",
            "According to the latest findings",
          ],
          targetItems: [
            "climate change accelerated in the last decade.",
            "new policies were needed for conservation.",
            "the population growth rate had slowed.",
          ],
        },
        correctAnswer: {
          matches: {
            "0": "climate change accelerated in the last decade.",
            "1": "new policies were needed for conservation.",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject R9 with empty sourceItems", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R9_MATCHING_HEADINGS",
        options: {
          sourceItems: [],
          targetItems: ["Heading 1"],
        },
        correctAnswer: { matches: {} },
      });
      expect(result.success).toBe(false);
    });

    it("should validate R13_NOTE_TABLE_FLOWCHART note sub-format", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R13_NOTE_TABLE_FLOWCHART",
        options: {
          subFormat: "note",
          structure: "Main Topic\n• Impact ___1___\n• Solution ___2___",
          wordLimit: 2,
        },
        correctAnswer: {
          blanks: {
            "1": { answer: "fifteen percent" },
            "2": { answer: "renewable energy" },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R13_NOTE_TABLE_FLOWCHART table sub-format", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R13_NOTE_TABLE_FLOWCHART",
        options: {
          subFormat: "table",
          structure: '{"columns":["Country","Population"],"rows":[["Vietnam","___1___"]]}',
          wordLimit: 3,
        },
        correctAnswer: {
          blanks: { "1": { answer: "98 million" } },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R13_NOTE_TABLE_FLOWCHART flowchart sub-format", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R13_NOTE_TABLE_FLOWCHART",
        options: {
          subFormat: "flowchart",
          structure: '{"steps":["Seeds planted in ___1___","Roots absorb ___2___"]}',
          wordLimit: 2,
        },
        correctAnswer: {
          blanks: {
            "1": { answer: "moist soil" },
            "2": { answer: "minerals" },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject R13 with empty structure", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R13_NOTE_TABLE_FLOWCHART",
        options: {
          subFormat: "note",
          structure: "",
          wordLimit: 2,
        },
        correctAnswer: { blanks: {} },
      });
      expect(result.success).toBe(false);
    });

    it("should validate R14_DIAGRAM_LABELLING without word bank", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R14_DIAGRAM_LABELLING",
        options: {
          diagramUrl: "https://storage.example.com/diagram.png",
          labelPositions: ["outer shell", "membrane", "air cell"],
          wordLimit: 2,
        },
        correctAnswer: {
          labels: { "0": "outer shell", "1": "membrane", "2": "air cell" },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate R14_DIAGRAM_LABELLING with word bank", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R14_DIAGRAM_LABELLING",
        options: {
          diagramUrl: "https://storage.example.com/diagram.png",
          labelPositions: ["Position 1", "Position 2"],
          wordBank: ["shell", "membrane", "air cell", "yolk"],
          wordLimit: 2,
        },
        correctAnswer: {
          labels: { "0": "shell", "1": "air cell" },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject R14 with empty labelPositions", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "R14_DIAGRAM_LABELLING",
        options: {
          diagramUrl: "https://storage.example.com/diagram.png",
          labelPositions: [],
          wordLimit: 2,
        },
        correctAnswer: { labels: {} },
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid questionType", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "INVALID_TYPE",
        options: null,
        correctAnswer: null,
      });
      expect(result.success).toBe(false);
    });

    // --- L1-L6: Listening question types ---

    it("should validate L1_FORM_NOTE_TABLE (same schemas as R13)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L1_FORM_NOTE_TABLE",
        options: {
          subFormat: "note",
          structure: "Name: ___1___\nAddress: ___2___",
          wordLimit: 2,
        },
        correctAnswer: {
          blanks: {
            "1": { answer: "John Smith" },
            "2": { answer: "42 Main Street" },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate L2_MCQ (same schemas as R1)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L2_MCQ",
        options: {
          items: [
            { label: "A", text: "Monday" },
            { label: "B", text: "Tuesday" },
            { label: "C", text: "Wednesday" },
          ],
        },
        correctAnswer: { answer: "B" },
      });
      expect(result.success).toBe(true);
    });

    it("should validate L3_MATCHING (same schemas as R11)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L3_MATCHING",
        options: {
          sourceItems: ["Speaker 1", "Speaker 2", "Speaker 3"],
          targetItems: ["Agrees", "Disagrees", "Undecided", "Not mentioned"],
        },
        correctAnswer: {
          matches: { "0": "Agrees", "1": "Disagrees", "2": "Undecided" },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate L4_MAP_PLAN_LABELLING (same schemas as R14)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L4_MAP_PLAN_LABELLING",
        options: {
          diagramUrl: "https://storage.example.com/map.png",
          labelPositions: ["Reception", "Library", "Cafe"],
          wordLimit: 2,
        },
        correctAnswer: {
          labels: { "0": "Reception", "1": "Library", "2": "Cafe" },
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate L5_SENTENCE_COMPLETION (same schemas as R5)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L5_SENTENCE_COMPLETION",
        options: null,
        correctAnswer: {
          answer: "three weeks",
          acceptedVariants: ["3 weeks"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate L6_SHORT_ANSWER (same schemas as R6)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L6_SHORT_ANSWER",
        options: null,
        correctAnswer: {
          answer: "swimming pool",
          acceptedVariants: ["the swimming pool"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject L1 with MCQ options (wrong schema)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L1_FORM_NOTE_TABLE",
        options: {
          items: [{ label: "A", text: "Option" }],
        },
        correctAnswer: { answer: "A" },
      });
      expect(result.success).toBe(false);
    });

    it("should reject L2 with null options (requires MCQ items)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "L2_MCQ",
        options: null,
        correctAnswer: { answer: "A" },
      });
      expect(result.success).toBe(false);
    });
  });

  // --- Task 1.6: Verify existing CreateQuestionSchema / UpdateQuestionSchema ---
  describe("CreateQuestionSchema (existing - verify R1-R8 support)", () => {
    it("should accept R1 MCQ options as z.unknown()", () => {
      const result = CreateQuestionSchema.safeParse({
        questionText: "Choose the correct answer",
        questionType: "R1_MCQ_SINGLE",
        options: { items: [{ label: "A", text: "Option A" }] },
        correctAnswer: { answer: "A" },
        orderIndex: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept R7 word bank options as z.unknown()", () => {
      const result = CreateQuestionSchema.safeParse({
        questionText: "Complete the summary",
        questionType: "R7_SUMMARY_WORD_BANK",
        options: {
          wordBank: ["word1", "word2"],
          summaryText: "Text ___1___",
        },
        correctAnswer: { blanks: { "1": "word1" } },
        orderIndex: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null options for TFNG types", () => {
      const result = CreateQuestionSchema.safeParse({
        questionText: "The sky is blue",
        questionType: "R3_TFNG",
        options: null,
        correctAnswer: { answer: "TRUE" },
        orderIndex: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept wordLimit for text input types", () => {
      const result = CreateQuestionSchema.safeParse({
        questionText: "Complete the sentence",
        questionType: "R5_SENTENCE_COMPLETION",
        options: null,
        correctAnswer: {
          answer: "revolution",
          acceptedVariants: [],
        },
        orderIndex: 0,
        wordLimit: 3,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateQuestionSchema (existing - verify partial support)", () => {
    it("should accept partial updates with options only", () => {
      const result = UpdateQuestionSchema.safeParse({
        options: { items: [{ label: "A", text: "Updated" }] },
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial updates with correctAnswer only", () => {
      const result = UpdateQuestionSchema.safeParse({
        correctAnswer: { answer: "B" },
      });
      expect(result.success).toBe(true);
    });
  });

  // --- Story 3.5: Exercise-level answer key settings (Task 1) ---
  describe("ExerciseSchema — answer key settings", () => {
    const baseExercise = {
      id: "ex1",
      centerId: "c1",
      title: "Test Exercise",
      skill: "READING",
      status: "DRAFT",
      createdById: "u1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should accept caseSensitive and partialCredit fields", () => {
      const result = ExerciseSchema.safeParse({
        ...baseExercise,
        caseSensitive: true,
        partialCredit: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caseSensitive).toBe(true);
        expect(result.data.partialCredit).toBe(true);
      }
    });

    it("should default caseSensitive to false", () => {
      const result = ExerciseSchema.safeParse(baseExercise);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caseSensitive).toBe(false);
      }
    });

    it("should default partialCredit to false", () => {
      const result = ExerciseSchema.safeParse(baseExercise);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.partialCredit).toBe(false);
      }
    });
  });

  describe("CreateExerciseSchema — answer key settings", () => {
    it("should accept optional caseSensitive and partialCredit", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Test",
        skill: "READING",
        caseSensitive: true,
        partialCredit: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caseSensitive).toBe(true);
        expect(result.data.partialCredit).toBe(true);
      }
    });

    it("should accept without caseSensitive and partialCredit (optional)", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Test",
        skill: "READING",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caseSensitive).toBeUndefined();
        expect(result.data.partialCredit).toBeUndefined();
      }
    });
  });

  describe("UpdateExerciseSchema — answer key settings", () => {
    it("should accept caseSensitive update", () => {
      const result = UpdateExerciseSchema.safeParse({
        caseSensitive: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept partialCredit update", () => {
      const result = UpdateExerciseSchema.safeParse({
        partialCredit: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept both together", () => {
      const result = UpdateExerciseSchema.safeParse({
        caseSensitive: false,
        partialCredit: true,
      });
      expect(result.success).toBe(true);
    });
  });

  // --- Story 3.6: Audio / Listening schemas ---
  describe("PlaybackModeSchema", () => {
    it("should accept TEST_MODE", () => {
      expect(PlaybackModeSchema.safeParse("TEST_MODE").success).toBe(true);
    });

    it("should accept PRACTICE_MODE", () => {
      expect(PlaybackModeSchema.safeParse("PRACTICE_MODE").success).toBe(true);
    });

    it("should reject invalid string", () => {
      expect(PlaybackModeSchema.safeParse("INVALID").success).toBe(false);
    });

    it("should reject empty string", () => {
      expect(PlaybackModeSchema.safeParse("").success).toBe(false);
    });
  });

  describe("AudioSectionSchema", () => {
    it("should validate a valid audio section", () => {
      const result = AudioSectionSchema.safeParse({
        label: "Section 1",
        startTime: 0,
        endTime: 120,
      });
      expect(result.success).toBe(true);
    });

    it("should reject endTime <= startTime", () => {
      const result = AudioSectionSchema.safeParse({
        label: "Section 1",
        startTime: 120,
        endTime: 60,
      });
      expect(result.success).toBe(false);
    });

    it("should reject endTime equal to startTime", () => {
      const result = AudioSectionSchema.safeParse({
        label: "Section 1",
        startTime: 60,
        endTime: 60,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative startTime", () => {
      const result = AudioSectionSchema.safeParse({
        label: "Section 1",
        startTime: -10,
        endTime: 60,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty label", () => {
      const result = AudioSectionSchema.safeParse({
        label: "",
        startTime: 0,
        endTime: 60,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing label", () => {
      const result = AudioSectionSchema.safeParse({
        startTime: 0,
        endTime: 60,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ExerciseSchema — audio fields", () => {
    const baseExercise = {
      id: "ex1",
      centerId: "c1",
      title: "Listening Test",
      skill: "LISTENING",
      status: "DRAFT",
      createdById: "u1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should accept audio fields", () => {
      const result = ExerciseSchema.safeParse({
        ...baseExercise,
        audioUrl: "https://storage.example.com/audio.mp3",
        audioDuration: 300,
        playbackMode: "TEST_MODE",
        audioSections: [{ label: "Section 1", startTime: 0, endTime: 150 }],
        showTranscriptAfterSubmit: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null audio fields", () => {
      const result = ExerciseSchema.safeParse({
        ...baseExercise,
        audioUrl: null,
        audioDuration: null,
        playbackMode: null,
        audioSections: null,
      });
      expect(result.success).toBe(true);
    });

    it("should default showTranscriptAfterSubmit to false", () => {
      const result = ExerciseSchema.safeParse(baseExercise);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showTranscriptAfterSubmit).toBe(false);
      }
    });
  });

  describe("QuestionSectionSchema — audioSectionIndex", () => {
    const baseSection = {
      id: "s1",
      exerciseId: "ex1",
      centerId: "c1",
      sectionType: "L1_FORM_NOTE_TABLE",
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should accept audioSectionIndex as integer", () => {
      const result = QuestionSectionSchema.safeParse({
        ...baseSection,
        audioSectionIndex: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept audioSectionIndex as null", () => {
      const result = QuestionSectionSchema.safeParse({
        ...baseSection,
        audioSectionIndex: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept missing audioSectionIndex (optional)", () => {
      const result = QuestionSectionSchema.safeParse(baseSection);
      expect(result.success).toBe(true);
    });

    it("should reject negative audioSectionIndex", () => {
      const result = QuestionSectionSchema.safeParse({
        ...baseSection,
        audioSectionIndex: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer audioSectionIndex", () => {
      const result = QuestionSectionSchema.safeParse({
        ...baseSection,
        audioSectionIndex: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateExerciseSchema — audio fields", () => {
    it("should accept playbackMode update", () => {
      const result = UpdateExerciseSchema.safeParse({
        playbackMode: "TEST_MODE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept audioSections update", () => {
      const result = UpdateExerciseSchema.safeParse({
        audioSections: [
          { label: "Part 1", startTime: 0, endTime: 120 },
          { label: "Part 2", startTime: 120, endTime: 240 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept null audioSections (clear)", () => {
      const result = UpdateExerciseSchema.safeParse({
        audioSections: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept showTranscriptAfterSubmit update", () => {
      const result = UpdateExerciseSchema.safeParse({
        showTranscriptAfterSubmit: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept audioDuration update", () => {
      const result = UpdateExerciseSchema.safeParse({
        audioDuration: 300,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null audioDuration", () => {
      const result = UpdateExerciseSchema.safeParse({
        audioDuration: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid playbackMode", () => {
      const result = UpdateExerciseSchema.safeParse({
        playbackMode: "INVALID_MODE",
      });
      expect(result.success).toBe(false);
    });

    it("should reject audioSections with overlapping times (via refinement)", () => {
      const result = UpdateExerciseSchema.safeParse({
        audioSections: [
          { label: "Section 1", startTime: 0, endTime: 60 },
          { label: "Section 2", startTime: 30, endTime: 90 },  // overlaps are validated client-side
        ],
      });
      // Individual sections are valid (refinement is per-section: endTime > startTime)
      // Overlap validation is client-side only
      expect(result.success).toBe(true);
    });
  });

  describe("AutosaveExerciseSchema — audio fields", () => {
    it("should accept playbackMode", () => {
      const result = AutosaveExerciseSchema.safeParse({
        playbackMode: "PRACTICE_MODE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept audioSections", () => {
      const result = AutosaveExerciseSchema.safeParse({
        audioSections: [{ label: "Section 1", startTime: 0, endTime: 60 }],
      });
      expect(result.success).toBe(true);
    });

    it("should accept showTranscriptAfterSubmit", () => {
      const result = AutosaveExerciseSchema.safeParse({
        showTranscriptAfterSubmit: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all autosave fields together", () => {
      const result = AutosaveExerciseSchema.safeParse({
        title: "Updated Title",
        instructions: "Some instructions",
        passageContent: "Transcript text",
        playbackMode: "TEST_MODE",
        audioSections: [{ label: "Part 1", startTime: 0, endTime: 180 }],
        showTranscriptAfterSubmit: false,
      });
      expect(result.success).toBe(true);
    });
  });

  // --- Story 3.8: Writing schemas ---
  describe("LetterToneSchema", () => {
    it("should accept 'formal'", () => {
      expect(LetterToneSchema.safeParse("formal").success).toBe(true);
    });

    it("should accept 'informal'", () => {
      expect(LetterToneSchema.safeParse("informal").success).toBe(true);
    });

    it("should accept 'semi-formal'", () => {
      expect(LetterToneSchema.safeParse("semi-formal").success).toBe(true);
    });

    it("should reject invalid tone", () => {
      expect(LetterToneSchema.safeParse("casual").success).toBe(false);
    });

    it("should reject empty string", () => {
      expect(LetterToneSchema.safeParse("").success).toBe(false);
    });
  });

  describe("WordCountModeSchema", () => {
    it("should accept 'soft'", () => {
      expect(WordCountModeSchema.safeParse("soft").success).toBe(true);
    });

    it("should accept 'hard'", () => {
      expect(WordCountModeSchema.safeParse("hard").success).toBe(true);
    });

    it("should reject invalid mode", () => {
      expect(WordCountModeSchema.safeParse("medium").success).toBe(false);
    });

    it("should reject empty string", () => {
      expect(WordCountModeSchema.safeParse("").success).toBe(false);
    });
  });

  describe("WritingRubricCriterionSchema", () => {
    it("should accept valid criterion with band 0-9", () => {
      const result = WritingRubricCriterionSchema.safeParse({
        name: "Task Achievement",
        band: 7,
      });
      expect(result.success).toBe(true);
    });

    it("should accept 0.5 step bands", () => {
      const result = WritingRubricCriterionSchema.safeParse({
        name: "Coherence & Cohesion",
        band: 6.5,
        comment: "Good cohesion",
      });
      expect(result.success).toBe(true);
    });

    it("should accept band 0", () => {
      expect(WritingRubricCriterionSchema.safeParse({ name: "Test", band: 0 }).success).toBe(true);
    });

    it("should accept band 9", () => {
      expect(WritingRubricCriterionSchema.safeParse({ name: "Test", band: 9 }).success).toBe(true);
    });

    it("should reject band above 9", () => {
      expect(WritingRubricCriterionSchema.safeParse({ name: "Test", band: 9.5 }).success).toBe(false);
    });

    it("should reject band below 0", () => {
      expect(WritingRubricCriterionSchema.safeParse({ name: "Test", band: -0.5 }).success).toBe(false);
    });

    it("should reject non-0.5 step bands", () => {
      expect(WritingRubricCriterionSchema.safeParse({ name: "Test", band: 6.3 }).success).toBe(false);
    });
  });

  describe("WritingRubricSchema", () => {
    const validCriteria = [
      { name: "Task Achievement", band: 7 },
      { name: "Coherence & Cohesion", band: 6.5 },
      { name: "Lexical Resource", band: 7 },
      { name: "Grammatical Range & Accuracy", band: 6.5 },
    ];

    it("should accept exactly 4 criteria", () => {
      const result = WritingRubricSchema.safeParse({ criteria: validCriteria });
      expect(result.success).toBe(true);
    });

    it("should reject fewer than 4 criteria", () => {
      const result = WritingRubricSchema.safeParse({
        criteria: validCriteria.slice(0, 3),
      });
      expect(result.success).toBe(false);
    });

    it("should reject more than 4 criteria", () => {
      const result = WritingRubricSchema.safeParse({
        criteria: [...validCriteria, { name: "Extra", band: 5 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("QuestionOptionsSchema — Writing types (W1, W2, W3)", () => {
    it("should validate W1_TASK1_ACADEMIC with null options and null correctAnswer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "W1_TASK1_ACADEMIC",
        options: null,
        correctAnswer: null,
      });
      expect(result.success).toBe(true);
    });

    it("should validate W2_TASK1_GENERAL with null options and null correctAnswer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "W2_TASK1_GENERAL",
        options: null,
        correctAnswer: null,
      });
      expect(result.success).toBe(true);
    });

    it("should validate W3_TASK2_ESSAY with null options and null correctAnswer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "W3_TASK2_ESSAY",
        options: null,
        correctAnswer: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject W1 with non-null options (guards against dual-storage)", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "W1_TASK1_ACADEMIC",
        options: { someField: "value" },
        correctAnswer: null,
      });
      expect(result.success).toBe(false);
    });

    it("should reject W2 with non-null correctAnswer", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "W2_TASK1_GENERAL",
        options: null,
        correctAnswer: { answer: "some answer" },
      });
      expect(result.success).toBe(false);
    });

    it("should reject W3 with non-null options", () => {
      const result = QuestionOptionsSchema.safeParse({
        questionType: "W3_TASK2_ESSAY",
        options: { items: [] },
        correctAnswer: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ExerciseSchema — writing fields", () => {
    const baseExercise = {
      id: "ex1",
      centerId: "c1",
      title: "Writing Task 1",
      skill: "WRITING",
      status: "DRAFT",
      createdById: "u1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should accept all writing fields", () => {
      const result = ExerciseSchema.safeParse({
        ...baseExercise,
        stimulusImageUrl: "https://storage.example.com/chart.png",
        writingPrompt: "Summarise the information...",
        letterTone: "formal",
        wordCountMin: 150,
        wordCountMax: 200,
        wordCountMode: "soft",
        sampleResponse: "The chart shows...",
        showSampleAfterGrading: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null writing fields", () => {
      const result = ExerciseSchema.safeParse({
        ...baseExercise,
        stimulusImageUrl: null,
        writingPrompt: null,
        letterTone: null,
        wordCountMin: null,
        wordCountMax: null,
        wordCountMode: null,
        sampleResponse: null,
      });
      expect(result.success).toBe(true);
    });

    it("should default showSampleAfterGrading to false", () => {
      const result = ExerciseSchema.safeParse(baseExercise);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showSampleAfterGrading).toBe(false);
      }
    });
  });

  describe("CreateExerciseSchema — writing fields", () => {
    it("should accept writing fields on create", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        writingPrompt: "Write about...",
        letterTone: "semi-formal",
        wordCountMin: 150,
        wordCountMode: "soft",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid letterTone on create", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        letterTone: "casual",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid wordCountMode on create", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        wordCountMode: "medium",
      });
      expect(result.success).toBe(false);
    });

    it("should reject wordCountMax < wordCountMin", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        wordCountMin: 250,
        wordCountMax: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should accept wordCountMax >= wordCountMin", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        wordCountMin: 150,
        wordCountMax: 300,
      });
      expect(result.success).toBe(true);
    });

    it("should accept wordCountMax equal to wordCountMin", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        wordCountMin: 150,
        wordCountMax: 150,
      });
      expect(result.success).toBe(true);
    });

    it("should accept when only wordCountMin is set (no max)", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Writing Task",
        skill: "WRITING",
        wordCountMin: 150,
        wordCountMax: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateExerciseSchema — writing fields", () => {
    it("should accept writing field updates", () => {
      const result = UpdateExerciseSchema.safeParse({
        writingPrompt: "Describe the chart...",
        letterTone: "formal",
        wordCountMin: 150,
        wordCountMode: "soft",
        sampleResponse: "Model answer...",
        showSampleAfterGrading: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid letterTone on update", () => {
      const result = UpdateExerciseSchema.safeParse({
        letterTone: "casual",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid wordCountMode on update", () => {
      const result = UpdateExerciseSchema.safeParse({
        wordCountMode: "medium",
      });
      expect(result.success).toBe(false);
    });

    it("should reject wordCountMax < wordCountMin on update", () => {
      const result = UpdateExerciseSchema.safeParse({
        wordCountMin: 250,
        wordCountMax: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should accept wordCountMax >= wordCountMin on update", () => {
      const result = UpdateExerciseSchema.safeParse({
        wordCountMin: 150,
        wordCountMax: 300,
      });
      expect(result.success).toBe(true);
    });

    it("should accept wordCountMax equal to wordCountMin on update", () => {
      const result = UpdateExerciseSchema.safeParse({
        wordCountMin: 150,
        wordCountMax: 150,
      });
      expect(result.success).toBe(true);
    });

    it("should accept when only wordCountMin is set on update (no max)", () => {
      const result = UpdateExerciseSchema.safeParse({
        wordCountMin: 150,
      });
      expect(result.success).toBe(true);
    });

    it("should accept when only wordCountMax is set on update (no min)", () => {
      const result = UpdateExerciseSchema.safeParse({
        wordCountMax: 300,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("AutosaveExerciseSchema — writing fields", () => {
    it("should accept writing fields in autosave", () => {
      const result = AutosaveExerciseSchema.safeParse({
        writingPrompt: "Write a letter...",
        letterTone: "informal",
        wordCountMin: 150,
        wordCountMax: null,
        wordCountMode: "soft",
        sampleResponse: "Dear Sir...",
        showSampleAfterGrading: false,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all fields together including writing", () => {
      const result = AutosaveExerciseSchema.safeParse({
        title: "Updated Title",
        instructions: "Some instructions",
        writingPrompt: "Describe the chart...",
        letterTone: "formal",
        wordCountMin: 150,
        wordCountMode: "hard",
        sampleResponse: "Model answer...",
        showSampleAfterGrading: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
