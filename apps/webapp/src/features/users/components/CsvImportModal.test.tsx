import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CsvImportModal } from "./CsvImportModal";

// Mock the API hooks
const mockValidateCsv = vi.fn();
const mockExecuteImport = vi.fn();
const mockDownloadTemplate = vi.fn();

vi.mock("../users.api", () => ({
  useDownloadTemplate: () => ({
    mutate: mockDownloadTemplate,
    isPending: false,
  }),
  useValidateCsv: () => ({
    mutateAsync: mockValidateCsv,
    isPending: false,
  }),
  useExecuteImport: () => ({
    mutateAsync: mockExecuteImport,
    isPending: false,
  }),
  useImportStatus: () => ({
    data: null,
  }),
  csvImportKeys: {
    all: ["csv-import"],
  },
  usersKeys: {
    all: ["users"],
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockValidationResult = {
  importLogId: "test-import-id",
  totalRows: 2,
  validRows: 2,
  duplicateRows: 0,
  errorRows: 0,
  rows: [
    {
      id: "row-1",
      rowNumber: 1,
      email: "test1@example.com",
      name: "Test User 1",
      role: "Teacher",
      status: "VALID",
      errorMessage: null,
    },
    {
      id: "row-2",
      rowNumber: 2,
      email: "test2@example.com",
      name: "Test User 2",
      role: "Student",
      status: "VALID",
      errorMessage: null,
    },
  ],
};

describe("CsvImportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Step transitions", () => {
    it("starts in upload step when modal is opened", () => {
      renderWithProviders(<CsvImportModal />);

      // Open modal
      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

      expect(screen.getByText("Import Users from CSV")).toBeInTheDocument();
      expect(
        screen.getByText(/upload a csv file to bulk import/i)
      ).toBeInTheDocument();
    });

    it("transitions from upload to preview after successful validation", async () => {
      mockValidateCsv.mockResolvedValue(mockValidationResult);

      renderWithProviders(<CsvImportModal />);

      // Open modal
      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

      // Create a mock CSV file
      const file = new File(["Email,Name,Role\ntest@example.com,Test,Teacher"], "test.csv", {
        type: "text/csv",
      });

      // Find the hidden file input and trigger change
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      // Wait for transition to preview
      await waitFor(() => {
        expect(screen.getByText("Review Import")).toBeInTheDocument();
      });

      // Should show summary card
      expect(screen.getByText("Total Rows")).toBeInTheDocument();
    });

    it("allows going back from preview to upload step", async () => {
      mockValidateCsv.mockResolvedValue(mockValidationResult);

      renderWithProviders(<CsvImportModal />);

      // Open modal
      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

      // Upload file to get to preview
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("Review Import")).toBeInTheDocument();
      });

      // Click back button
      fireEvent.click(screen.getByRole("button", { name: /back/i }));

      // Should be back at upload step
      expect(screen.getByText("Import Users from CSV")).toBeInTheDocument();
    });

    it("disables import button when no valid rows are selected", async () => {
      mockValidateCsv.mockResolvedValue({
        importLogId: "test-import-id",
        totalRows: 1,
        validRows: 0,
        duplicateRows: 1,
        errorRows: 0,
        rows: [
          {
            id: "row-1",
            rowNumber: 1,
            email: "duplicate@example.com",
            name: "Duplicate User",
            role: "Teacher",
            status: "DUPLICATE_IN_CENTER",
            errorMessage: "Already exists",
          },
        ],
      });

      renderWithProviders(<CsvImportModal />);

      // Open modal and upload file
      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("Review Import")).toBeInTheDocument();
      });

      // Import button should show 0 rows selected
      expect(screen.getByText("0 row(s) selected")).toBeInTheDocument();
    });

    it("resets to upload step when modal is closed and reopened", async () => {
      mockValidateCsv.mockResolvedValue(mockValidationResult);

      renderWithProviders(<CsvImportModal />);

      // Open modal and go to preview
      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("Review Import")).toBeInTheDocument();
      });

      // Close modal by pressing escape
      fireEvent.keyDown(document, { key: "Escape" });

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByText("Review Import")).not.toBeInTheDocument();
      });

      // Re-open modal
      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

      // Should be back at upload step (state reset)
      expect(screen.getByText("Import Users from CSV")).toBeInTheDocument();
    });
  });

  describe("File validation", () => {
    it("shows error toast for non-CSV files", async () => {
      const { toast } = await import("sonner");

      renderWithProviders(<CsvImportModal />);

      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Please upload a CSV file");
      });
    });

    it("shows error toast for files exceeding 5MB limit", async () => {
      const { toast } = await import("sonner");

      renderWithProviders(<CsvImportModal />);

      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

      // Create a file that appears to be > 5MB
      const largeFile = new File(["x"], "large.csv", { type: "text/csv" });
      Object.defineProperty(largeFile, "size", { value: 6 * 1024 * 1024 });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [largeFile] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "File too large. Maximum size is 5MB."
        );
      });
    });
  });

  describe("Row selection behavior", () => {
    it("auto-selects only valid rows after validation", async () => {
      mockValidateCsv.mockResolvedValue({
        importLogId: "test-import-id",
        totalRows: 3,
        validRows: 2,
        duplicateRows: 1,
        errorRows: 0,
        rows: [
          {
            id: "row-1",
            rowNumber: 1,
            email: "valid1@example.com",
            name: "Valid User 1",
            role: "Teacher",
            status: "VALID",
            errorMessage: null,
          },
          {
            id: "row-2",
            rowNumber: 2,
            email: "duplicate@example.com",
            name: "Duplicate User",
            role: "Student",
            status: "DUPLICATE_IN_CENTER",
            errorMessage: "Already exists",
          },
          {
            id: "row-3",
            rowNumber: 3,
            email: "valid2@example.com",
            name: "Valid User 2",
            role: "Student",
            status: "VALID",
            errorMessage: null,
          },
        ],
      });

      renderWithProviders(<CsvImportModal />);

      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        // Should show 2 rows selected (only valid ones auto-selected)
        expect(screen.getByText("2 row(s) selected")).toBeInTheDocument();
      });
    });

    it("allows deselecting valid rows via checkbox", async () => {
      mockValidateCsv.mockResolvedValue({
        importLogId: "test-import-id",
        totalRows: 1,
        validRows: 1,
        duplicateRows: 0,
        errorRows: 0,
        rows: [
          {
            id: "row-1",
            rowNumber: 1,
            email: "test@example.com",
            name: "Test User",
            role: "Teacher",
            status: "VALID",
            errorMessage: null,
          },
        ],
      });

      renderWithProviders(<CsvImportModal />);

      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("1 row(s) selected")).toBeInTheDocument();
      });

      // Find and click the row checkbox to deselect
      const checkbox = screen.getByRole("checkbox", { name: /select row 1/i });
      fireEvent.click(checkbox);

      expect(screen.getByText("0 row(s) selected")).toBeInTheDocument();
    });
  });

  describe("Template download", () => {
    it("calls download template mutation when link is clicked", async () => {
      renderWithProviders(<CsvImportModal />);

      fireEvent.click(screen.getByRole("button", { name: /import csv/i }));
      fireEvent.click(screen.getByText(/download template/i));

      expect(mockDownloadTemplate).toHaveBeenCalled();
    });
  });
});
