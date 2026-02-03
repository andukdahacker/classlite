import { useState } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { CsvImportHistoryQuery } from "@workspace/types";
import { useImportHistory, useRetryImport } from "../users.api";
import { format } from "date-fns";

type StatusFilter = CsvImportHistoryQuery["status"] | "ALL";

export function ImportHistorySection() {
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const query: CsvImportHistoryQuery = {
    page,
    limit: 10,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  };

  const { data, isLoading } = useImportHistory(query);
  const retryImport = useRetryImport();

  const handleRetry = async (importLogId: string) => {
    try {
      await retryImport.mutateAsync({ importLogId, input: {} });
      toast.success("Retry started");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to retry import"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Partial
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "PROCESSING":
        return <Badge variant="outline">Processing</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                View past CSV imports and retry failed ones
              </CardDescription>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent>
        <CardContent>
          {/* Filter */}
          <div className="flex items-center gap-4 mb-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No imports yet.</p>
              <p className="text-sm">
                Import your first roster using the "Import CSV" button above.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Imported By</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Imported</TableHead>
                    <TableHead className="text-center">Failed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.fileName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {item.importedBy.name || item.importedBy.email}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.totalRows}
                      </TableCell>
                      <TableCell className="text-center text-green-600">
                        {item.importedRows}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {item.failedRows}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {(item.status === "FAILED" ||
                          item.status === "PARTIAL") &&
                          item.failedRows > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(item.id)}
                              disabled={retryImport.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Retry
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.total > data.limit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * data.limit + 1} to{" "}
                    {Math.min(page * data.limit, data.total)} of {data.total}{" "}
                    imports
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!data.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
}
