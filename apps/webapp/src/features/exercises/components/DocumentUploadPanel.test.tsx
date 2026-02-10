import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, vi, expect } from "vitest";
import { DocumentUploadPanel } from "./DocumentUploadPanel";

// Mock the document upload hook
const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock("../hooks/use-document-upload", () => ({
  useDocumentUpload: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

describe("DocumentUploadPanel", () => {
  const defaultProps = {
    exerciseId: "ex-1",
    currentPassageContent: null,
    currentSourceType: null,
    onPassageUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it("renders with Upload Document and Paste Text tabs", () => {
    render(<DocumentUploadPanel {...defaultProps} />);
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
    expect(screen.getByText("Paste Text")).toBeInTheDocument();
  });

  it("shows import passage title", () => {
    render(<DocumentUploadPanel {...defaultProps} />);
    expect(screen.getByText("Import Passage")).toBeInTheDocument();
  });

  it("shows current source type badge when provided", () => {
    render(
      <DocumentUploadPanel {...defaultProps} currentSourceType="PDF" />,
    );
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("shows drag and drop area in upload tab", () => {
    render(<DocumentUploadPanel {...defaultProps} />);
    expect(
      screen.getByText(/Drag & drop a PDF or DOCX file/),
    ).toBeInTheDocument();
    expect(screen.getByText("Max 10MB")).toBeInTheDocument();
  });

  it("switches to paste tab when clicked", () => {
    render(<DocumentUploadPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Paste Text"));
    expect(
      screen.getByPlaceholderText("Paste your reading passage text here..."),
    ).toBeInTheDocument();
  });

  it("shows word count in paste tab", () => {
    render(<DocumentUploadPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(
      "Paste your reading passage text here...",
    );
    fireEvent.change(textarea, { target: { value: "hello world test" } });
    expect(screen.getByText("3 words")).toBeInTheDocument();
  });

  it("calls onPassageUpdated when paste text is submitted", () => {
    const onPassageUpdated = vi.fn();
    render(
      <DocumentUploadPanel
        {...defaultProps}
        onPassageUpdated={onPassageUpdated}
      />,
    );
    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(
      "Paste your reading passage text here...",
    );
    fireEvent.change(textarea, {
      target: { value: "This is a test passage." },
    });
    fireEvent.click(screen.getByText("Use This Text"));
    expect(onPassageUpdated).toHaveBeenCalledWith(
      "This is a test passage.",
      "TEXT_PASTE",
    );
  });

  it("disables Use This Text button when paste text is empty", () => {
    render(<DocumentUploadPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Paste Text"));
    const button = screen.getByText("Use This Text");
    expect(button).toBeDisabled();
  });

  it("shows extracted text preview after upload", async () => {
    mockMutateAsync.mockResolvedValue({
      extractedText: "Extracted content from document",
      passageSourceType: "PDF",
      passageSourceUrl: null,
    });

    render(<DocumentUploadPanel {...defaultProps} />);

    // Simulate file selection via file input change
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["fake-pdf"], "test.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Extracted Text/),
      ).toBeInTheDocument();
    });
  });

  it("shows error for files exceeding 10MB", () => {
    render(<DocumentUploadPanel {...defaultProps} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const bigFile = new File(["x".repeat(100)], "big.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(bigFile, "size", { value: 11 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(
      screen.getByText("File size exceeds 10MB limit"),
    ).toBeInTheDocument();
  });

  it("shows error for unsupported file types", () => {
    render(<DocumentUploadPanel {...defaultProps} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const txtFile = new File(["text"], "test.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [txtFile] } });

    expect(
      screen.getByText("Only PDF and DOCX files are supported"),
    ).toBeInTheDocument();
  });
});
