import { vi, describe, it, expect, beforeEach } from "vitest";
import { DocumentExtractionService } from "./document-extraction.service.js";

// Mock pdfjs-dist
vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: vi.fn(),
}));

// Mock mammoth
vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

describe("DocumentExtractionService", () => {
  let service: DocumentExtractionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentExtractionService();
  });

  describe("extractFromPDF", () => {
    it("should extract text from a single-page PDF", async () => {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: "Hello " },
            { str: "World" },
          ],
        }),
      };
      const mockDoc = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockDoc),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const buffer = Buffer.from("fake-pdf-data");
      const result = await service.extractFromPDF(buffer);

      expect(result).toBe("Hello  World");
      expect(mockDoc.getPage).toHaveBeenCalledWith(1);
    });

    it("should extract text from multi-page PDF", async () => {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const mockPages = [
        {
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: "Page 1 text" }],
          }),
        },
        {
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: "Page 2 text" }],
          }),
        },
      ];
      const mockDoc = {
        numPages: 2,
        getPage: vi.fn().mockImplementation((pageNum: number) =>
          Promise.resolve(mockPages[pageNum - 1]),
        ),
      };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockDoc),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const buffer = Buffer.from("fake-pdf");
      const result = await service.extractFromPDF(buffer);

      expect(result).toBe("Page 1 text\n\nPage 2 text");
      expect(mockDoc.getPage).toHaveBeenCalledTimes(2);
    });

    it("should filter out non-text items (TextMarkedContent)", async () => {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: "Real text" },
            { type: "beginMarkedContent", tag: "P" }, // TextMarkedContent
            { str: " more text" },
          ],
        }),
      };
      const mockDoc = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockDoc),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const buffer = Buffer.from("fake-pdf");
      const result = await service.extractFromPDF(buffer);

      // The TextMarkedContent item (no `str` property) should be filtered out
      expect(result).toBe("Real text  more text");
    });
  });

  describe("extractFromDocx", () => {
    it("should extract text from a DOCX buffer", async () => {
      const mammoth = await import("mammoth");
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: "Extracted DOCX text content",
        messages: [],
      });

      const buffer = Buffer.from("fake-docx-data");
      const result = await service.extractFromDocx(buffer);

      expect(result).toBe("Extracted DOCX text content");
      expect(mammoth.default.extractRawText).toHaveBeenCalledWith({ buffer });
    });
  });

  describe("extractText", () => {
    it("should route PDF files to extractFromPDF", async () => {
      const spy = vi
        .spyOn(service, "extractFromPDF")
        .mockResolvedValue("PDF text");

      const buffer = Buffer.from("data");
      const result = await service.extractText(buffer, "application/pdf");

      expect(result).toBe("PDF text");
      expect(spy).toHaveBeenCalledWith(buffer);
    });

    it("should route DOCX files to extractFromDocx", async () => {
      const spy = vi
        .spyOn(service, "extractFromDocx")
        .mockResolvedValue("DOCX text");

      const buffer = Buffer.from("data");
      const result = await service.extractText(
        buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      expect(result).toBe("DOCX text");
      expect(spy).toHaveBeenCalledWith(buffer);
    });

    it("should throw for unsupported file types", async () => {
      const buffer = Buffer.from("data");
      await expect(
        service.extractText(buffer, "text/plain"),
      ).rejects.toThrow("Unsupported file type: text/plain");
    });
  });
});
