import { describe, it, expect, vi, beforeEach } from "vitest";
import { CsvImportRowStatus, CsvImportStatus } from "@workspace/db";

// Mock data structures
const createMockTenantedClient = () => ({
  centerMembership: {
    findMany: vi.fn(),
  },
  csvImportLog: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  csvImportRowLog: {
    findMany: vi.fn(),
  },
});

let mockTenantedClient = createMockTenantedClient();

// Mock @workspace/db at module level
vi.mock("@workspace/db", () => ({
  getTenantedClient: vi.fn(() => mockTenantedClient),
  PrismaClient: vi.fn(() => ({})),
  CsvImportStatus: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    PARTIAL: "PARTIAL",
    FAILED: "FAILED",
  },
  CsvImportRowStatus: {
    VALID: "VALID",
    DUPLICATE_IN_CSV: "DUPLICATE_IN_CSV",
    DUPLICATE_IN_CENTER: "DUPLICATE_IN_CENTER",
    ERROR: "ERROR",
    IMPORTED: "IMPORTED",
    SKIPPED: "SKIPPED",
    FAILED: "FAILED",
  },
}));

// Mock crypto
vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "test-uuid"),
}));

// Import after mocks
import { CsvImportService } from "./csv-import.service.js";

describe("CsvImportService", () => {
  let service: CsvImportService;
  const centerId = "test-center-id";
  const userId = "test-user-id";

  beforeEach(() => {
    mockTenantedClient = createMockTenantedClient();
    vi.clearAllMocks();
    service = new CsvImportService({} as any);
  });

  describe("generateTemplate", () => {
    it("returns CSV template with headers and example rows", () => {
      const template = service.generateTemplate();

      expect(template).toContain("Email,Name,Role");
      expect(template).toContain("teacher1@example.com,John Smith,Teacher");
      expect(template).toContain("student1@example.com,Jane Doe,Student");
    });

    it("has exactly 3 lines (header + 2 examples)", () => {
      const template = service.generateTemplate();
      const lines = template.split("\n");

      expect(lines).toHaveLength(3);
    });
  });

  describe("parseAndValidate", () => {
    beforeEach(() => {
      // Default: no existing memberships
      mockTenantedClient.centerMembership.findMany.mockResolvedValue([]);
      mockTenantedClient.csvImportLog.create.mockResolvedValue({
        id: "import-log-id",
        rows: [],
      });
    });

    describe("CSV parsing", () => {
      it("parses valid CSV with standard headers", async () => {
        const csv = `Email,Name,Role
john@example.com,John Doe,Teacher
jane@example.com,Jane Doe,Student`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
            {
              id: "row-2",
              rowNumber: 2,
              email: "jane@example.com",
              name: "Jane Doe",
              role: "STUDENT",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.totalRows).toBe(2);
        expect(result.validRows).toBe(2);
        expect(result.errorRows).toBe(0);
      });

      it("throws error for invalid CSV format", async () => {
        const invalidCsv = "not,a,valid\ncsv\"file";

        await expect(
          service.parseAndValidate(
            Buffer.from(invalidCsv),
            centerId,
            userId,
            "test.csv"
          )
        ).rejects.toThrow();
      });

      it("throws error when CSV is empty", async () => {
        const emptyCsv = "Email,Name,Role";

        await expect(
          service.parseAndValidate(
            Buffer.from(emptyCsv),
            centerId,
            userId,
            "test.csv"
          )
        ).rejects.toThrow("CSV file is empty");
      });

      it("throws error when row count exceeds 1000", async () => {
        const rows = ["Email,Name,Role"];
        for (let i = 0; i < 1001; i++) {
          rows.push(`user${i}@example.com,User ${i},Student`);
        }
        const largeCsv = rows.join("\n");

        await expect(
          service.parseAndValidate(
            Buffer.from(largeCsv),
            centerId,
            userId,
            "test.csv"
          )
        ).rejects.toThrow("Too many rows");
      });
    });

    describe("header normalization", () => {
      it("accepts lowercase headers (email, name, role)", async () => {
        const csv = `email,name,role
john@example.com,John Doe,Teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(1);
      });

      it("accepts uppercase headers (EMAIL, NAME, ROLE)", async () => {
        const csv = `EMAIL,NAME,ROLE
john@example.com,John Doe,Teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(1);
      });

      it("accepts mixed case headers (Email, Name, Role)", async () => {
        const csv = `Email,Name,Role
john@example.com,John Doe,Teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(1);
      });

      it("throws error when required column is missing", async () => {
        const csv = `Email,Name
john@example.com,John Doe`;

        await expect(
          service.parseAndValidate(
            Buffer.from(csv),
            centerId,
            userId,
            "test.csv"
          )
        ).rejects.toThrow("Missing required column(s): Role");
      });
    });

    describe("validation rules", () => {
      it("marks row as error when email is missing", async () => {
        const csv = `Email,Name,Role
,John Doe,Teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.ERROR,
              errorMessage: "Email is required",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.errorRows).toBe(1);
      });

      it("marks row as error when email format is invalid", async () => {
        const csv = `Email,Name,Role
invalid-email,John Doe,Teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "invalid-email",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.ERROR,
              errorMessage: "Invalid email format",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.errorRows).toBe(1);
      });

      it("marks row as error when name is missing", async () => {
        const csv = `Email,Name,Role
john@example.com,,Teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "",
              role: "TEACHER",
              status: CsvImportRowStatus.ERROR,
              errorMessage: "Name is required",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.errorRows).toBe(1);
      });

      it("marks row as error when role is invalid", async () => {
        const csv = `Email,Name,Role
john@example.com,John Doe,Manager`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "Manager",
              status: CsvImportRowStatus.ERROR,
              errorMessage: "Role must be 'Teacher' or 'Student'",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.errorRows).toBe(1);
      });

      it("accepts Teacher role (case insensitive)", async () => {
        const csv = `Email,Name,Role
john@example.com,John Doe,teacher`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(1);
      });
    });

    describe("duplicate detection", () => {
      it("detects duplicate emails within CSV", async () => {
        const csv = `Email,Name,Role
john@example.com,John Doe,Teacher
john@example.com,John Smith,Student`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
            {
              id: "row-2",
              rowNumber: 2,
              email: "john@example.com",
              name: "John Smith",
              role: "STUDENT",
              status: CsvImportRowStatus.DUPLICATE_IN_CSV,
              errorMessage: "Duplicate email in row 1",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(1);
        expect(result.duplicateRows).toBe(1);
      });

      it("detects duplicate emails against existing center members", async () => {
        const csv = `Email,Name,Role
existing@example.com,Existing User,Teacher`;

        // Mock existing membership
        mockTenantedClient.centerMembership.findMany.mockResolvedValue([
          {
            user: { email: "existing@example.com" },
          },
        ]);

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "existing@example.com",
              name: "Existing User",
              role: "TEACHER",
              status: CsvImportRowStatus.DUPLICATE_IN_CENTER,
              errorMessage: "Email already invited to this center",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(0);
        expect(result.duplicateRows).toBe(1);
      });

      it("handles case-insensitive email duplicate detection", async () => {
        const csv = `Email,Name,Role
JOHN@EXAMPLE.COM,John Doe,Teacher
john@example.com,John Smith,Student`;

        mockTenantedClient.csvImportLog.create.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "JOHN@EXAMPLE.COM",
              name: "John Doe",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
            {
              id: "row-2",
              rowNumber: 2,
              email: "john@example.com",
              name: "John Smith",
              role: "STUDENT",
              status: CsvImportRowStatus.DUPLICATE_IN_CSV,
              errorMessage: "Duplicate email in row 1",
            },
          ],
        });

        const result = await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        expect(result.validRows).toBe(1);
        expect(result.duplicateRows).toBe(1);
      });
    });

    describe("formula injection prevention", () => {
      it("escapes values starting with =", async () => {
        const csv = `Email,Name,Role
john@example.com,=SUM(A1),Teacher`;

        // The service should escape the name
        const createCall = mockTenantedClient.csvImportLog.create;
        createCall.mockResolvedValue({
          id: "import-log-id",
          rows: [
            {
              id: "row-1",
              rowNumber: 1,
              email: "john@example.com",
              name: "'=SUM(A1)",
              role: "TEACHER",
              status: CsvImportRowStatus.VALID,
              errorMessage: null,
            },
          ],
        });

        await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        // Check that create was called with escaped value
        expect(createCall).toHaveBeenCalled();
        const createArg = createCall.mock.calls[0][0];
        const rowData = createArg.data.rows.create[0];
        expect(rowData.name).toBe("'=SUM(A1)");
      });

      it("escapes values starting with +", async () => {
        const csv = `Email,Name,Role
john@example.com,+1234567890,Teacher`;

        const createCall = mockTenantedClient.csvImportLog.create;
        createCall.mockResolvedValue({
          id: "import-log-id",
          rows: [],
        });

        await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        const createArg = createCall.mock.calls[0][0];
        const rowData = createArg.data.rows.create[0];
        expect(rowData.name).toBe("'+1234567890");
      });

      it("escapes values starting with -", async () => {
        const csv = `Email,Name,Role
john@example.com,-John Doe,Teacher`;

        const createCall = mockTenantedClient.csvImportLog.create;
        createCall.mockResolvedValue({
          id: "import-log-id",
          rows: [],
        });

        await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        const createArg = createCall.mock.calls[0][0];
        const rowData = createArg.data.rows.create[0];
        expect(rowData.name).toBe("'-John Doe");
      });

      it("escapes values starting with @", async () => {
        const csv = `Email,Name,Role
john@example.com,@username,Teacher`;

        const createCall = mockTenantedClient.csvImportLog.create;
        createCall.mockResolvedValue({
          id: "import-log-id",
          rows: [],
        });

        await service.parseAndValidate(
          Buffer.from(csv),
          centerId,
          userId,
          "test.csv"
        );

        const createArg = createCall.mock.calls[0][0];
        const rowData = createArg.data.rows.create[0];
        expect(rowData.name).toBe("'@username");
      });
    });
  });

  describe("getImportStatus", () => {
    it("returns correct status for pending import", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue({
        id: "import-log-id",
        status: CsvImportStatus.PENDING,
        importedRows: 0,
        failedRows: 0,
        rows: [],
      });

      const result = await service.getImportStatus("import-log-id", centerId);

      expect(result.status).toBe(CsvImportStatus.PENDING);
      expect(result.isComplete).toBe(false);
    });

    it("returns correct status for completed import", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue({
        id: "import-log-id",
        status: CsvImportStatus.COMPLETED,
        importedRows: 10,
        failedRows: 0,
        rows: [],
      });

      const result = await service.getImportStatus("import-log-id", centerId);

      expect(result.status).toBe(CsvImportStatus.COMPLETED);
      expect(result.isComplete).toBe(true);
      expect(result.importedRows).toBe(10);
    });

    it("throws error when import not found", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue(null);

      await expect(
        service.getImportStatus("nonexistent-id", centerId)
      ).rejects.toThrow("Import not found");
    });
  });

  describe("getImportHistory", () => {
    it("returns paginated history", async () => {
      mockTenantedClient.csvImportLog.findMany.mockResolvedValue([
        {
          id: "import-1",
          fileName: "test1.csv",
          totalRows: 10,
          validRows: 8,
          importedRows: 8,
          failedRows: 0,
          status: CsvImportStatus.COMPLETED,
          createdAt: new Date("2024-01-01"),
          completedAt: new Date("2024-01-01"),
          importedBy: { id: "user-1", name: "Test User", email: "test@example.com" },
        },
      ]);
      mockTenantedClient.csvImportLog.count.mockResolvedValue(1);

      const result = await service.getImportHistory(centerId, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("filters by status when provided", async () => {
      mockTenantedClient.csvImportLog.findMany.mockResolvedValue([]);
      mockTenantedClient.csvImportLog.count.mockResolvedValue(0);

      await service.getImportHistory(centerId, {
        page: 1,
        limit: 20,
        status: CsvImportStatus.FAILED,
      });

      expect(mockTenantedClient.csvImportLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: CsvImportStatus.FAILED },
        })
      );
    });
  });

  describe("getFailedRows", () => {
    it("returns only failed rows", async () => {
      mockTenantedClient.csvImportRowLog.findMany.mockResolvedValue([
        {
          id: "row-1",
          rowNumber: 1,
          email: "failed@example.com",
          name: "Failed User",
          role: "TEACHER",
          status: CsvImportRowStatus.FAILED,
          errorMessage: "Network error",
        },
      ]);

      const result = await service.getFailedRows("import-log-id", centerId);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(CsvImportRowStatus.FAILED);
    });
  });

  describe("verifyImportOwnership", () => {
    it("returns true when import belongs to center", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue({
        id: "import-log-id",
      });

      const result = await service.verifyImportOwnership("import-log-id", centerId);

      expect(result).toBe(true);
    });

    it("returns false when import does not belong to center", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue(null);

      const result = await service.verifyImportOwnership("other-import-id", centerId);

      expect(result).toBe(false);
    });
  });

  describe("markProcessing", () => {
    it("throws error when import does not belong to center", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue(null);

      await expect(
        service.markProcessing("other-import-id", centerId, "job-id")
      ).rejects.toThrow("Import not found");
    });

    it("updates import status when ownership is verified", async () => {
      mockTenantedClient.csvImportLog.findUnique.mockResolvedValue({
        id: "import-log-id",
      });
      mockTenantedClient.csvImportLog.update.mockResolvedValue({});

      await service.markProcessing("import-log-id", centerId, "job-id");

      expect(mockTenantedClient.csvImportLog.update).toHaveBeenCalledWith({
        where: { id: "import-log-id" },
        data: {
          status: CsvImportStatus.PROCESSING,
          jobId: "job-id",
        },
      });
    });
  });
});
