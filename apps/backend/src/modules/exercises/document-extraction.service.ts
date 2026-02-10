import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import { AppError } from "../../errors/app-error.js";

export class DocumentExtractionService {
  async extractFromPDF(buffer: Buffer): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((item: any) => "str" in item)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(" ");
      pages.push(text);
    }

    return pages.join("\n\n");
  }

  async extractFromDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case "application/pdf":
        return this.extractFromPDF(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return this.extractFromDocx(buffer);
      default:
        throw AppError.badRequest(`Unsupported file type: ${mimeType}`);
    }
  }
}
