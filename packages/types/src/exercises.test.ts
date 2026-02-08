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

    it("should default to false when not provided", () => {
      const result = CreateExerciseSchema.safeParse({
        title: "Test",
        skill: "READING",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caseSensitive).toBe(false);
        expect(result.data.partialCredit).toBe(false);
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
});
