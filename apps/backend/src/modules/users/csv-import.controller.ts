import type {
  CsvValidationResponse,
  CsvExecuteRequest,
  CsvExecuteResponse,
  CsvImportStatusResponse,
  CsvImportHistoryQuery,
  CsvImportHistoryResponse,
  CsvImportDetailsResponse,
  CsvRetryRequest,
  CsvRetryResponse,
} from "@workspace/types";
import { AppError } from "../../errors/app-error.js";
import { CsvImportService } from "./csv-import.service.js";
import { inngest } from "../inngest/client.js";

interface JwtPayload {
  uid: string;
  email: string;
  role: string;
  centerId: string | null;
}

export class CsvImportController {
  constructor(
    private readonly csvImportService: CsvImportService,
    private readonly resolveUid: (firebaseUid: string) => Promise<string>,
  ) {}

  /**
   * Generate and return CSV template
   */
  getTemplate(): string {
    return this.csvImportService.generateTemplate();
  }

  /**
   * Validate uploaded CSV file
   */
  async validateCsv(
    buffer: Buffer,
    fileName: string,
    user: JwtPayload
  ): Promise<CsvValidationResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const userId = await this.resolveUid(user.uid);
    const result = await this.csvImportService.parseAndValidate(
      buffer,
      centerId,
      userId,
      fileName
    );

    return {
      data: result,
      message: "CSV validated successfully",
    };
  }

  /**
   * Execute import - queue Inngest job
   */
  async executeImport(
    input: CsvExecuteRequest,
    user: JwtPayload
  ): Promise<CsvExecuteResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    // Generate a job ID
    const jobId = crypto.randomUUID();

    // Mark import as processing
    await this.csvImportService.markProcessing(
      input.importLogId,
      centerId,
      jobId
    );

    // Queue the Inngest job
    await inngest.send({
      name: "csv-import/process-batch",
      data: {
        importLogId: input.importLogId,
        selectedRowIds: input.selectedRowIds,
        centerId,
        requestingUserId: await this.resolveUid(user.uid),
      },
    });

    return {
      data: {
        jobId,
        importLogId: input.importLogId,
      },
      message: "Import queued successfully",
    };
  }

  /**
   * Get import status for polling
   */
  async getImportStatus(
    importLogId: string,
    user: JwtPayload
  ): Promise<CsvImportStatusResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const status = await this.csvImportService.getImportStatus(
      importLogId,
      centerId
    );

    return {
      data: status,
      message: "Status retrieved successfully",
    };
  }

  /**
   * Get import history
   */
  async getImportHistory(
    query: CsvImportHistoryQuery,
    user: JwtPayload
  ): Promise<CsvImportHistoryResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.csvImportService.getImportHistory(
      centerId,
      query
    );

    return {
      data: result,
      message: "History retrieved successfully",
    };
  }

  /**
   * Get import details
   */
  async getImportDetails(
    importLogId: string,
    user: JwtPayload
  ): Promise<CsvImportDetailsResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const details = await this.csvImportService.getImportDetails(
      importLogId,
      centerId
    );

    return {
      data: details,
      message: "Details retrieved successfully",
    };
  }

  /**
   * Retry failed rows
   */
  async retryImport(
    importLogId: string,
    input: CsvRetryRequest,
    user: JwtPayload
  ): Promise<CsvRetryResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    // Get failed rows
    const failedRows = await this.csvImportService.getFailedRows(
      importLogId,
      centerId
    );

    if (failedRows.length === 0) {
      throw AppError.badRequest("No failed rows to retry");
    }

    // Filter to specific rows if provided
    let rowsToRetry = failedRows;
    if (input.rowIds && input.rowIds.length > 0) {
      rowsToRetry = failedRows.filter((row) => input.rowIds!.includes(row.id));
    }

    if (rowsToRetry.length === 0) {
      throw AppError.badRequest("No matching failed rows to retry");
    }

    // Generate a job ID
    const jobId = crypto.randomUUID();

    // Mark import as processing again
    await this.csvImportService.markProcessing(importLogId, centerId, jobId);

    // Queue the Inngest job
    await inngest.send({
      name: "csv-import/process-batch",
      data: {
        importLogId,
        selectedRowIds: rowsToRetry.map((r) => r.id),
        centerId,
        requestingUserId: await this.resolveUid(user.uid),
        isRetry: true,
      },
    });

    return {
      data: {
        jobId,
        importLogId,
        rowsToRetry: rowsToRetry.length,
      },
      message: "Retry queued successfully",
    };
  }
}
