"use client";

import { GetClassResponse } from "@workspace/types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ColumnDefinition } from "@workspace/ui/components/lazy-data-table";
import dayjs from "dayjs";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface AssignmentsTableProps {
  classMembers: GetClassResponse["data"]["classMembers"];
}

type AssignmentData = {
  studentName: string;
  exerciseTitle: string;
  status: "ASSIGNED" | "SUBMITTED" | "REVIEWED";
  dueDate: string | null;
  submittedAt: string | null;
  submissionId: string | null;
  assignmentId: string;
};

export function AssignmentsTable({ classMembers }: AssignmentsTableProps) {
  const router = useRouter();

  const data: AssignmentData[] = useMemo(() => {
    if (!classMembers) return [];
    return classMembers.flatMap((member) => {
      const studentName = `${member.user.firstName} ${member.user.lastName}`;
      return member.assignments.map((a) => ({
        studentName,
        exerciseTitle: a.exercise.name,
        status: a.assignment.status,
        dueDate: a.assignment.dueDate,
        submittedAt: a.submission?.createdAt,
        submissionId: a.submission?.id ?? null,
        assignmentId: a.assignment.id,
      }));
    });
  }, [classMembers]);

  const columns: ColumnDefinition<AssignmentData>[] = [
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
    },
    {
      accessorKey: "exerciseTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Exercise" />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as AssignmentData["status"];
        let variant: "default" | "secondary" | "destructive" | "outline" =
          "secondary";
        if (status === "SUBMITTED") variant = "default";
        if (status === "REVIEWED") variant = "outline";

        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate") as string;
        return dueDate ? dayjs(dueDate).format("DD MMM YYYY") : "N/A";
      },
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Submitted" />
      ),
      cell: ({ row }) => {
        const submittedAt = row.getValue("submittedAt") as string;
        return submittedAt
          ? dayjs(submittedAt).format("DD MMM YYYY")
          : "Not yet";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const { assignmentId } = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  router.push(`/dashboard/assignments/${assignmentId}`)
                }
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
