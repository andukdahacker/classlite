import { parse } from "csv-parse/sync";
import { AppError } from "../../errors/app-error.js";
import {
  PrismaClient,
  getTenantedClient,
  CsvImportStatus,
  CsvImportRowStatus,
} from "@workspace/db";
import type {
  CsvValidationResult,
  CsvValidatedRow,
  CsvImportHistoryQuery,
  CsvImportHistoryItem,
} from "@workspace/types";
import { randomUUID } from "crypto";

interface ParsedCsvRow {
  email?: string;
  name?: string;
  role?: string;
  Email?: string;
  Name?: string;
  Role?: string;
  EMAIL?: string;
  NAME?: string;
  ROLE?: string;
  [key: string]: string | undefined;
}

export class CsvImportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Generate CSV template with headers and example rows
   */
  generateTemplate(): string {
    return [
      "Email,Name,Role",
      "teacher1@example.com,John Smith,Teacher",
      "student1@example.com,Jane Doe,Student",
    ].join("\n");
  }

  /**
   * Parse and validate CSV buffer
   */
  async parseAndValidate(
    buffer: Buffer,
    centerId: string,
    userId: string,
    fileName: string
  ): Promise<CsvValidationResult> {
    const content = buffer.toString("utf-8");
    const db = getTenantedClient(this.prisma, centerId);

    // Parse CSV
    let records: ParsedCsvRow[];
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch {
      throw AppError.badRequest("Invalid CSV format. Please check file structure.");
    }

    // Check row count limit
    if (records.length > 1000) {
      throw AppError.badRequest("Too many rows. Maximum is 1,000 rows per import.");
    }

    if (records.length === 0) {
      throw AppError.badRequest("CSV file is empty. Please add data rows.");
    }

    // Normalize headers and extract data
    const normalizedRows = this.normalizeHeaders(records);

    // Validate headers exist
    if (normalizedRows.length > 0) {
      const firstRow = normalizedRows[0]!;
      const missingColumns: string[] = [];
      if (firstRow.email === undefined) missingColumns.push("Email");
      if (firstRow.name === undefined) missingColumns.push("Name");
      if (firstRow.role === undefined) missingColumns.push("Role");

      if (missingColumns.length > 0) {
        throw AppError.badRequest(`Missing required column(s): ${missingColumns.join(", ")}`);
      }
    }

    // Track emails for duplicate detection within CSV
    const emailsInCsv = new Map<string, number>();

    // Get existing emails in center
    const existingMemberships = await db.centerMembership.findMany({
      include: { user: true },
    });
    const existingEmails = new Set(
      existingMemberships
        .filter((m) => m.user.email)
        .map((m) => m.user.email!.toLowerCase())
    );

    // Validate each row
    const validatedRows: CsvValidatedRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < normalizedRows.length; i++) {
      const row = normalizedRows[i]!;
      const rowNumber = i + 1;
      const rowId = randomUUID();

      const email = this.escapeForDisplay(row.email?.trim() ?? "");
      const name = this.escapeForDisplay(row.name?.trim() ?? "");
      const role = this.escapeForDisplay(row.role?.trim() ?? "");
      const emailLower = email.toLowerCase();

      // Validate row
      const errors: string[] = [];

      // Email validation
      if (!email) {
        errors.push("Email is required");
      } else if (!this.isValidEmail(email)) {
        errors.push("Invalid email format");
      }

      // Name validation
      if (!name) {
        errors.push("Name is required");
      } else if (name.length > 100) {
        errors.push("Name too long (max 100 characters)");
      }

      // Role validation
      const normalizedRole = role.toLowerCase();
      if (!role) {
        errors.push("Role is required");
      } else if (!["teacher", "student"].includes(normalizedRole)) {
        errors.push("Role must be 'Teacher' or 'Student'");
      }

      // Determine row status
      let status: CsvImportRowStatus;
      let errorMessage: string | null = null;

      if (errors.length > 0) {
        status = CsvImportRowStatus.ERROR;
        errorMessage = errors.join("; ");
        errorCount++;
      } else if (emailsInCsv.has(emailLower)) {
        status = CsvImportRowStatus.DUPLICATE_IN_CSV;
        errorMessage = `Duplicate email in row ${emailsInCsv.get(emailLower)}`;
        duplicateCount++;
      } else if (existingEmails.has(emailLower)) {
        status = CsvImportRowStatus.DUPLICATE_IN_CENTER;
        errorMessage = "Email already invited to this center";
        duplicateCount++;
      } else {
        status = CsvImportRowStatus.VALID;
        validCount++;
      }

      // Track email for duplicate detection
      if (email && !emailsInCsv.has(emailLower)) {
        emailsInCsv.set(emailLower, rowNumber);
      }

      validatedRows.push({
        id: rowId,
        rowNumber,
        email,
        name,
        role: this.capitalizeRole(role),
        status,
        errorMessage,
      });
    }

    // Create import log with row logs
    const importLog = await db.csvImportLog.create({
      data: {
        centerId,
        importedById: userId,
        fileName,
        totalRows: normalizedRows.length,
        validRows: validCount,
        duplicateRows: duplicateCount,
        errorRows: errorCount,
        status: CsvImportStatus.PENDING,
        rows: {
          create: validatedRows.map((row) => ({
            rowNumber: row.rowNumber,
            email: row.email,
            name: row.name,
            role: row.role,
            status: row.status,
            errorMessage: row.errorMessage,
          })),
        },
      },
      include: {
        rows: true,
      },
    });

    // Map row IDs from database
    const rowsWithDbIds = importLog.rows.map((dbRow) => ({
      id: dbRow.id,
      rowNumber: dbRow.rowNumber,
      email: dbRow.email,
      name: dbRow.name,
      role: dbRow.role,
      status: dbRow.status as CsvImportRowStatus,
      errorMessage: dbRow.errorMessage,
    }));

    return {
      importLogId: importLog.id,
      totalRows: normalizedRows.length,
      validRows: validCount,
      duplicateRows: duplicateCount,
      errorRows: errorCount,
      rows: rowsWithDbIds,
    };
  }

  /**
   * Get import status for polling
   */
  async getImportStatus(
    importLogId: string,
    centerId: string
  ): Promise<{
    status: CsvImportStatus;
    importedRows: number;
    failedRows: number;
    totalSelected: number;
    isComplete: boolean;
  }> {
    const db = getTenantedClient(this.prisma, centerId);

    const importLog = await db.csvImportLog.findUnique({
      where: { id: importLogId },
      include: {
        rows: {
          where: {
            status: {
              in: [
                CsvImportRowStatus.VALID,
                CsvImportRowStatus.IMPORTED,
                CsvImportRowStatus.FAILED,
              ],
            },
          },
        },
      },
    });

    if (!importLog) {
      throw AppError.notFound("Import not found");
    }

    const totalSelected = importLog.rows.filter(
      (r) =>
        r.status === CsvImportRowStatus.VALID ||
        r.status === CsvImportRowStatus.IMPORTED ||
        r.status === CsvImportRowStatus.FAILED
    ).length;

    const completedStatuses: CsvImportStatus[] = [
      CsvImportStatus.COMPLETED,
      CsvImportStatus.PARTIAL,
      CsvImportStatus.FAILED,
    ];
    const isComplete = completedStatuses.includes(importLog.status);

    return {
      status: importLog.status,
      importedRows: importLog.importedRows,
      failedRows: importLog.failedRows,
      totalSelected,
      isComplete,
    };
  }

  /**
   * Get import history for center
   */
  async getImportHistory(
    centerId: string,
    query: CsvImportHistoryQuery
  ): Promise<{
    items: CsvImportHistoryItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const db = getTenantedClient(this.prisma, centerId);
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      db.csvImportLog.findMany({
        where,
        include: {
          importedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.csvImportLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        totalRows: item.totalRows,
        validRows: item.validRows,
        importedRows: item.importedRows,
        failedRows: item.failedRows,
        status: item.status as CsvImportStatus,
        importedBy: {
          id: item.importedBy.id,
          name: item.importedBy.name,
          email: item.importedBy.email,
        },
        createdAt: item.createdAt.toISOString(),
        completedAt: item.completedAt?.toISOString() ?? null,
      })),
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Get import details with all rows
   */
  async getImportDetails(importLogId: string, centerId: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const importLog = await db.csvImportLog.findUnique({
      where: { id: importLogId },
      include: {
        importedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rows: {
          orderBy: { rowNumber: "asc" },
        },
      },
    });

    if (!importLog) {
      throw AppError.notFound("Import not found");
    }

    return {
      id: importLog.id,
      fileName: importLog.fileName,
      totalRows: importLog.totalRows,
      validRows: importLog.validRows,
      importedRows: importLog.importedRows,
      failedRows: importLog.failedRows,
      status: importLog.status,
      importedBy: {
        id: importLog.importedBy.id,
        name: importLog.importedBy.name,
        email: importLog.importedBy.email,
      },
      createdAt: importLog.createdAt.toISOString(),
      completedAt: importLog.completedAt?.toISOString() ?? null,
      rows: importLog.rows.map((row) => ({
        id: row.id,
        rowNumber: row.rowNumber,
        email: row.email,
        name: row.name,
        role: row.role,
        status: row.status,
        errorMessage: row.errorMessage,
      })),
    };
  }

  /**
   * Get rows to retry for a failed/partial import
   */
  async getFailedRows(importLogId: string, centerId: string) {
    const db = getTenantedClient(this.prisma, centerId);

    const rows = await db.csvImportRowLog.findMany({
      where: {
        importLogId,
        status: CsvImportRowStatus.FAILED,
      },
      orderBy: { rowNumber: "asc" },
    });

    return rows;
  }

  /**
   * Verify import belongs to center (security check)
   */
  async verifyImportOwnership(
    importLogId: string,
    centerId: string
  ): Promise<boolean> {
    const db = getTenantedClient(this.prisma, centerId);
    const importLog = await db.csvImportLog.findUnique({
      where: { id: importLogId },
      select: { id: true },
    });
    return importLog !== null;
  }

  /**
   * Mark import as processing
   */
  async markProcessing(importLogId: string, centerId: string, jobId: string) {
    const db = getTenantedClient(this.prisma, centerId);

    // Verify ownership before updating
    const exists = await this.verifyImportOwnership(importLogId, centerId);
    if (!exists) {
      throw AppError.notFound("Import not found");
    }

    await db.csvImportLog.update({
      where: { id: importLogId },
      data: {
        status: CsvImportStatus.PROCESSING,
        jobId,
      },
    });
  }

  // Private helpers

  private normalizeHeaders(
    records: ParsedCsvRow[]
  ): { email?: string; name?: string; role?: string }[] {
    return records.map((record) => {
      const normalized: { email?: string; name?: string; role?: string } = {};

      for (const [key, value] of Object.entries(record)) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey === "email") normalized.email = value;
        if (lowerKey === "name") normalized.name = value;
        if (lowerKey === "role") normalized.role = value;
      }

      return normalized;
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private escapeForDisplay(value: string): string {
    if (/^[=+\-@]/.test(value)) {
      return "'" + value;
    }
    return value;
  }

  private capitalizeRole(role: string): string {
    if (!role) return "";
    const lower = role.toLowerCase();
    if (lower === "teacher") return "TEACHER";
    if (lower === "student") return "STUDENT";
    return role.toUpperCase();
  }
}
