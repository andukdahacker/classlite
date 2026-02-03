import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import type { CsvValidationResult, CsvValidatedRow } from "@workspace/types";
import {
  useDownloadTemplate,
  useValidateCsv,
  useExecuteImport,
  useImportStatus,
  csvImportKeys,
  usersKeys,
} from "../users.api";
import { useQueryClient } from "@tanstack/react-query";

type ImportStep = "upload" | "preview" | "progress" | "complete";

interface CsvImportModalProps {
  onSuccess?: () => void;
}

export function CsvImportModal({ onSuccess }: CsvImportModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [validationResult, setValidationResult] =
    useState<CsvValidationResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importLogId, setImportLogId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const downloadTemplate = useDownloadTemplate();
  const validateCsv = useValidateCsv();
  const executeImport = useExecuteImport();
  const { data: importStatus } = useImportStatus(
    importLogId,
    step === "progress"
  );

  // Handle import completion
  useEffect(() => {
    if (importStatus?.isComplete && step === "progress") {
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: csvImportKeys.all });
    }
  }, [importStatus?.isComplete, step, queryClient]);

  const resetModal = useCallback(() => {
    setStep("upload");
    setValidationResult(null);
    setSelectedIds(new Set());
    setImportLogId(null);
    setIsDragging(false);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetModal();
      }
    },
    [resetModal]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }

      try {
        const result = await validateCsv.mutateAsync(file);
        setValidationResult(result);
        // Auto-select all valid rows
        const validIds = new Set(
          result.rows.filter((r) => r.status === "VALID").map((r) => r.id)
        );
        setSelectedIds(validIds);
        setStep("preview");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to validate CSV"
        );
      }
    },
    [validateCsv]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const toggleRow = useCallback((rowId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const toggleAllValid = useCallback(() => {
    if (!validationResult) return;
    const validIds = validationResult.rows
      .filter((r) => r.status === "VALID")
      .map((r) => r.id);
    setSelectedIds((prev) => {
      const allSelected = validIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect all valid rows
        const next = new Set(prev);
        validIds.forEach((id) => next.delete(id));
        return next;
      } else {
        // Select all valid rows
        return new Set([...prev, ...validIds]);
      }
    });
  }, [validationResult]);

  const handleExecute = useCallback(async () => {
    if (!validationResult || selectedIds.size === 0) return;

    try {
      const result = await executeImport.mutateAsync({
        importLogId: validationResult.importLogId,
        selectedRowIds: Array.from(selectedIds),
      });
      setImportLogId(result.importLogId);
      setStep("progress");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start import"
      );
    }
  }, [validationResult, selectedIds, executeImport]);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (step === "complete") {
      onSuccess?.();
    }
    resetModal();
  }, [step, onSuccess, resetModal]);

  const getStatusBadge = (status: CsvValidatedRow["status"]) => {
    switch (status) {
      case "VALID":
        return (
          <Badge variant="default" className="bg-green-500">
            Valid
          </Badge>
        );
      case "DUPLICATE_IN_CSV":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Duplicate in CSV
          </Badge>
        );
      case "DUPLICATE_IN_CENTER":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Already exists
          </Badge>
        );
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      case "IMPORTED":
        return (
          <Badge variant="default" className="bg-green-500">
            Imported
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Users from CSV"}
            {step === "preview" && "Review Import"}
            {step === "progress" && "Importing Users..."}
            {step === "complete" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a CSV file to bulk import users to your center."}
            {step === "preview" &&
              "Review the data below and select rows to import."}
            {step === "progress" && "Please wait while we process your import."}
            {step === "complete" && "Your import has been processed."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop your CSV file here, or{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Max file size: 5MB, Max rows: 1,000
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => downloadTemplate.mutate()}
                disabled={downloadTemplate.isPending}
              >
                <Download className="mr-1 h-4 w-4" />
                Download template
              </Button>
              {validateCsv.isPending && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && validationResult && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{validationResult.totalRows}</p>
              </div>
              <div className="rounded-lg border p-3 border-green-500/50 bg-green-500/5">
                <p className="text-sm text-muted-foreground">Valid</p>
                <p className="text-2xl font-bold text-green-600">
                  {validationResult.validRows}
                </p>
              </div>
              <div className="rounded-lg border p-3 border-yellow-500/50 bg-yellow-500/5">
                <p className="text-sm text-muted-foreground">Duplicates</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {validationResult.duplicateRows}
                </p>
              </div>
              <div className="rounded-lg border p-3 border-red-500/50 bg-red-500/5">
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {validationResult.errorRows}
                </p>
              </div>
            </div>

            {/* Data table */}
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          validationResult.rows
                            .filter((r) => r.status === "VALID")
                            .every((r) => selectedIds.has(r.id))
                        }
                        onCheckedChange={toggleAllValid}
                        aria-label="Select all valid rows"
                      />
                    </TableHead>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={
                        row.status !== "VALID" ? "opacity-60" : undefined
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleRow(row.id)}
                          disabled={row.status !== "VALID"}
                          aria-label={`Select row ${row.rowNumber}`}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.email}
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(row.status)}
                          {row.errorMessage && (
                            <span className="text-xs text-red-500">
                              {row.errorMessage}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} row(s) selected
                </span>
                <Button
                  onClick={handleExecute}
                  disabled={selectedIds.size === 0 || executeImport.isPending}
                >
                  {executeImport.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>Import {selectedIds.size} User(s)</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Progress */}
        {step === "progress" && importStatus && (
          <div className="space-y-6 py-8">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Processing import...</p>
              <p className="text-sm text-muted-foreground">
                {importStatus.importedRows + importStatus.failedRows} of{" "}
                {importStatus.totalSelected} processed
              </p>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${
                    importStatus.totalSelected > 0
                      ? ((importStatus.importedRows + importStatus.failedRows) /
                          importStatus.totalSelected) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{importStatus.importedRows} imported</span>
              </div>
              {importStatus.failedRows > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{importStatus.failedRows} failed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && importStatus && (
          <div className="space-y-6 py-8">
            <div className="flex justify-center">
              {importStatus.failedRows === 0 ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : importStatus.importedRows > 0 ? (
                <AlertTriangle className="h-16 w-16 text-yellow-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">
                {importStatus.failedRows === 0
                  ? "Import Successful!"
                  : importStatus.importedRows > 0
                    ? "Import Partially Complete"
                    : "Import Failed"}
              </p>
              <p className="text-sm text-muted-foreground">
                {importStatus.importedRows} user(s) imported successfully
                {importStatus.failedRows > 0 &&
                  `, ${importStatus.failedRows} failed`}
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
