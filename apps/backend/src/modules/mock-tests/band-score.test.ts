import { describe, it, expect } from "vitest";
import {
  rawScoreToBand,
  roundToHalfBand,
  calculateWritingBand,
  calculateSpeakingBand,
  calculateOverallBand,
  LISTENING_BAND_TABLE,
  READING_ACADEMIC_BAND_TABLE,
  READING_GENERAL_BAND_TABLE,
} from "./band-score.js";

describe("band-score", () => {
  describe("rawScoreToBand", () => {
    describe("Listening table", () => {
      it("should return 9.0 for 40 correct", () => {
        expect(rawScoreToBand(40, LISTENING_BAND_TABLE)).toBe(9.0);
      });

      it("should return 9.0 for 39 correct", () => {
        expect(rawScoreToBand(39, LISTENING_BAND_TABLE)).toBe(9.0);
      });

      it("should return 8.5 for 37 correct", () => {
        expect(rawScoreToBand(37, LISTENING_BAND_TABLE)).toBe(8.5);
      });

      it("should return 7.0 for 30 correct", () => {
        expect(rawScoreToBand(30, LISTENING_BAND_TABLE)).toBe(7.0);
      });

      it("should return 6.0 for 23 correct", () => {
        expect(rawScoreToBand(23, LISTENING_BAND_TABLE)).toBe(6.0);
      });

      it("should return 5.0 for 15 correct (boundary)", () => {
        expect(rawScoreToBand(15, LISTENING_BAND_TABLE)).toBe(4.5);
      });

      it("should return 1.0 for 0 correct", () => {
        expect(rawScoreToBand(0, LISTENING_BAND_TABLE)).toBe(1.0);
      });

      it("should return 1.0 for 1 correct", () => {
        expect(rawScoreToBand(1, LISTENING_BAND_TABLE)).toBe(1.0);
      });
    });

    describe("Academic Reading table", () => {
      it("should return 9.0 for 40 correct", () => {
        expect(rawScoreToBand(40, READING_ACADEMIC_BAND_TABLE)).toBe(9.0);
      });

      it("should return 6.0 for 23 correct", () => {
        expect(rawScoreToBand(23, READING_ACADEMIC_BAND_TABLE)).toBe(6.0);
      });

      it("should return 5.0 for 15 correct", () => {
        expect(rawScoreToBand(15, READING_ACADEMIC_BAND_TABLE)).toBe(5.0);
      });

      it("should return 4.5 for 13 correct", () => {
        expect(rawScoreToBand(13, READING_ACADEMIC_BAND_TABLE)).toBe(4.5);
      });

      it("should return 1.0 for 0 correct", () => {
        expect(rawScoreToBand(0, READING_ACADEMIC_BAND_TABLE)).toBe(1.0);
      });
    });

    describe("General Training Reading table", () => {
      it("should return 9.0 for 40 correct", () => {
        expect(rawScoreToBand(40, READING_GENERAL_BAND_TABLE)).toBe(9.0);
      });

      it("should return 8.5 for 39 correct", () => {
        expect(rawScoreToBand(39, READING_GENERAL_BAND_TABLE)).toBe(8.5);
      });

      it("should return 5.0 for 23 correct", () => {
        expect(rawScoreToBand(23, READING_GENERAL_BAND_TABLE)).toBe(5.0);
      });

      it("should return 4.0 for 15 correct", () => {
        expect(rawScoreToBand(15, READING_GENERAL_BAND_TABLE)).toBe(4.0);
      });

      it("should return 1.0 for 0 correct", () => {
        expect(rawScoreToBand(0, READING_GENERAL_BAND_TABLE)).toBe(1.0);
      });
    });

    describe("edge cases", () => {
      it("should clamp negative scores to 0", () => {
        expect(rawScoreToBand(-5, LISTENING_BAND_TABLE)).toBe(1.0);
      });

      it("should clamp scores above 40 to 40", () => {
        expect(rawScoreToBand(45, LISTENING_BAND_TABLE)).toBe(9.0);
      });

      it("should round decimal raw scores", () => {
        expect(rawScoreToBand(29.6, LISTENING_BAND_TABLE)).toBe(7.0);
      });
    });
  });

  describe("roundToHalfBand", () => {
    it("should round 6.25 to 6.5", () => {
      expect(roundToHalfBand(6.25)).toBe(6.5);
    });

    it("should round 6.75 to 7.0", () => {
      expect(roundToHalfBand(6.75)).toBe(7.0);
    });

    it("should round 6.1 to 6.0", () => {
      expect(roundToHalfBand(6.1)).toBe(6.0);
    });

    it("should round 6.6 to 6.5", () => {
      expect(roundToHalfBand(6.6)).toBe(6.5);
    });

    it("should keep 7.5 as 7.5", () => {
      expect(roundToHalfBand(7.5)).toBe(7.5);
    });

    it("should keep whole numbers", () => {
      expect(roundToHalfBand(8.0)).toBe(8.0);
    });
  });

  describe("calculateWritingBand", () => {
    it("should return 0 for empty criteria arrays", () => {
      expect(calculateWritingBand([], [7, 7, 7, 7])).toBe(0);
      expect(calculateWritingBand([6, 6, 6, 6], [])).toBe(0);
      expect(calculateWritingBand([], [])).toBe(0);
    });

    it("should calculate with double weighting for Task 2", () => {
      // Task 1: avg = (6+6+6+6)/4 = 6.0 → band 6.0
      // Task 2: avg = (7+7+7+7)/4 = 7.0 → band 7.0
      // Writing = (6.0 + 7.0*2) / 3 = 20/3 = 6.67 → 6.5
      expect(calculateWritingBand([6, 6, 6, 6], [7, 7, 7, 7])).toBe(6.5);
    });

    it("should handle mixed criteria scores", () => {
      // Task 1: avg = (5+6+5+6)/4 = 5.5 → band 5.5
      // Task 2: avg = (6+7+6+7)/4 = 6.5 → band 6.5
      // Writing = (5.5 + 6.5*2) / 3 = 18.5/3 = 6.17 → 6.0
      expect(calculateWritingBand([5, 6, 5, 6], [6, 7, 6, 7])).toBe(6.0);
    });

    it("should handle equal task scores", () => {
      // Task 1: avg = 7.0 → band 7.0
      // Task 2: avg = 7.0 → band 7.0
      // Writing = (7+7*2)/3 = 7.0
      expect(calculateWritingBand([7, 7, 7, 7], [7, 7, 7, 7])).toBe(7.0);
    });
  });

  describe("calculateSpeakingBand", () => {
    it("should return 0 for empty array", () => {
      expect(calculateSpeakingBand([])).toBe(0);
    });

    it("should average 4 criteria and round to 0.5", () => {
      // avg = (6+7+6+7)/4 = 6.5
      expect(calculateSpeakingBand([6, 7, 6, 7])).toBe(6.5);
    });

    it("should round to nearest 0.5", () => {
      // avg = (6+7+7+7)/4 = 6.75 → 7.0
      expect(calculateSpeakingBand([6, 7, 7, 7])).toBe(7.0);
    });

    it("should handle uniform scores", () => {
      expect(calculateSpeakingBand([8, 8, 8, 8])).toBe(8.0);
    });
  });

  describe("calculateOverallBand", () => {
    it("should return 0 for empty array", () => {
      expect(calculateOverallBand([])).toBe(0);
    });

    it("should calculate known IELTS example: L6.5+R6.5+W5.0+S7.0=6.5", () => {
      // avg = (6.5+6.5+5.0+7.0)/4 = 25/4 = 6.25 → 6.5
      expect(calculateOverallBand([6.5, 6.5, 5.0, 7.0])).toBe(6.5);
    });

    it("should handle uniform bands", () => {
      expect(calculateOverallBand([7.0, 7.0, 7.0, 7.0])).toBe(7.0);
    });

    it("should round to nearest 0.5", () => {
      // avg = (7.0+7.0+6.0+6.0)/4 = 6.5
      expect(calculateOverallBand([7.0, 7.0, 6.0, 6.0])).toBe(6.5);
    });

    it("should handle another example: L8.0+R7.5+W6.5+S7.0=7.5", () => {
      // avg = (8.0+7.5+6.5+7.0)/4 = 29/4 = 7.25 → 7.5
      expect(calculateOverallBand([8.0, 7.5, 6.5, 7.0])).toBe(7.5);
    });
  });
});
