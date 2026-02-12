-- RenameTable: csv_import_logs → csv_import_log (singular naming convention)
ALTER TABLE "csv_import_logs" RENAME TO "csv_import_log";

-- RenameTable: csv_import_row_logs → csv_import_row_log (singular naming convention)
ALTER TABLE "csv_import_row_logs" RENAME TO "csv_import_row_log";

-- Rename indexes to match new table names
ALTER INDEX "csv_import_logs_pkey" RENAME TO "csv_import_log_pkey";
ALTER INDEX "csv_import_logs_center_id_idx" RENAME TO "csv_import_log_center_id_idx";
ALTER INDEX "csv_import_logs_status_idx" RENAME TO "csv_import_log_status_idx";
ALTER INDEX "csv_import_row_logs_pkey" RENAME TO "csv_import_row_log_pkey";
ALTER INDEX "csv_import_row_logs_import_log_id_idx" RENAME TO "csv_import_row_log_import_log_id_idx";

-- Rename foreign key constraints to match new table names
ALTER TABLE "csv_import_log" RENAME CONSTRAINT "csv_import_logs_center_id_fkey" TO "csv_import_log_center_id_fkey";
ALTER TABLE "csv_import_log" RENAME CONSTRAINT "csv_import_logs_imported_by_id_fkey" TO "csv_import_log_imported_by_id_fkey";
ALTER TABLE "csv_import_row_log" RENAME CONSTRAINT "csv_import_row_logs_import_log_id_fkey" TO "csv_import_row_log_import_log_id_fkey";
