import { z } from "zod";

// Enums matching Prisma schema
export const CsvImportStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
]);

export type CsvImportStatus = z.infer<typeof CsvImportStatusEnum>;

export const CsvImportRowStatusEnum = z.enum([
  "VALID",
  "DUPLICATE_IN_CSV",
  "DUPLICATE_IN_CENTER",
  "ERROR",
  "IMPORTED",
  "SKIPPED",
  "FAILED",
]);

export type CsvImportRowStatus = z.infer<typeof CsvImportRowStatusEnum>;

// Validated row schema (returned from validation endpoint)
export const CsvValidatedRowSchema = z.object({
  id: z.string(),
  rowNumber: z.number(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  status: CsvImportRowStatusEnum,
  errorMessage: z.string().nullable(),
});

export type CsvValidatedRow = z.infer<typeof CsvValidatedRowSchema>;

// Validation result schema
export const CsvValidationResultSchema = z.object({
  importLogId: z.string(),
  totalRows: z.number(),
  validRows: z.number(),
  duplicateRows: z.number(),
  errorRows: z.number(),
  rows: z.array(CsvValidatedRowSchema),
});

export type CsvValidationResult = z.infer<typeof CsvValidationResultSchema>;

// Validation response
export const CsvValidationResponseSchema = z.object({
  data: CsvValidationResultSchema,
  message: z.string(),
});

export type CsvValidationResponse = z.infer<typeof CsvValidationResponseSchema>;

// Execute request schema
export const CsvExecuteRequestSchema = z.object({
  importLogId: z.string(),
  selectedRowIds: z.array(z.string()).min(1, "Select at least one row"),
});

export type CsvExecuteRequest = z.infer<typeof CsvExecuteRequestSchema>;

// Execute response schema
export const CsvExecuteResponseSchema = z.object({
  data: z.object({
    jobId: z.string(),
    importLogId: z.string(),
  }),
  message: z.string(),
});

export type CsvExecuteResponse = z.infer<typeof CsvExecuteResponseSchema>;

// Import status schema (for polling)
export const CsvImportStatusResponseSchema = z.object({
  data: z.object({
    status: CsvImportStatusEnum,
    importedRows: z.number(),
    failedRows: z.number(),
    totalSelected: z.number(),
    isComplete: z.boolean(),
  }),
  message: z.string(),
});

export type CsvImportStatusResponse = z.infer<typeof CsvImportStatusResponseSchema>;

// Import history query schema
export const CsvImportHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: CsvImportStatusEnum.optional(),
});

export type CsvImportHistoryQuery = z.infer<typeof CsvImportHistoryQuerySchema>;

// Import history item schema
export const CsvImportHistoryItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  totalRows: z.number(),
  validRows: z.number(),
  importedRows: z.number(),
  failedRows: z.number(),
  status: CsvImportStatusEnum,
  importedBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export type CsvImportHistoryItem = z.infer<typeof CsvImportHistoryItemSchema>;

// Import history response
export const CsvImportHistoryResponseSchema = z.object({
  data: z.object({
    items: z.array(CsvImportHistoryItemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  }),
  message: z.string(),
});

export type CsvImportHistoryResponse = z.infer<typeof CsvImportHistoryResponseSchema>;

// Import details response (single import with all rows)
export const CsvImportDetailsResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    fileName: z.string(),
    totalRows: z.number(),
    validRows: z.number(),
    importedRows: z.number(),
    failedRows: z.number(),
    status: CsvImportStatusEnum,
    importedBy: z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    }),
    createdAt: z.string(),
    completedAt: z.string().nullable(),
    rows: z.array(CsvValidatedRowSchema),
  }),
  message: z.string(),
});

export type CsvImportDetailsResponse = z.infer<typeof CsvImportDetailsResponseSchema>;

// Retry request schema
export const CsvRetryRequestSchema = z.object({
  rowIds: z.array(z.string()).min(1, "Select at least one row to retry").optional(),
});

export type CsvRetryRequest = z.infer<typeof CsvRetryRequestSchema>;

// Retry response schema
export const CsvRetryResponseSchema = z.object({
  data: z.object({
    jobId: z.string(),
    importLogId: z.string(),
    rowsToRetry: z.number(),
  }),
  message: z.string(),
});

export type CsvRetryResponse = z.infer<typeof CsvRetryResponseSchema>;
