"use client";

import { Class } from "@workspace/types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DataTable } from "@workspace/ui/components/data-table";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import dayjs from "dayjs";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetUserList } from "../../users/hooks/use-get-user-list";
import useUpdateClass from "../hooks/use-update-class";

interface AddClassMemberTableProps {
  classId: string;
}

function AddClassMemberTable({ classId }: AddClassMemberTableProps) {
  const { data: users } = useGetUserList();

  const [rowSelection, setRowSelection] = useState({});

  const students =
    users?.filter(
      (user) =>
        (user.user.role == "STUDENT" || user.user.role == "TEACHER") &&
        !user.classes.find((e) => e.id == classId),
    ) ?? [];

  const { mutateAsync, isPending } = useUpdateClass();

  const router = useRouter();

  const handleAddStudents = async () => {
    const selectedStudents = Object.keys(rowSelection).map((key) => {
      return students[parseInt(key)]!;
    });

    if (selectedStudents.length > 0) {
      try {
        await mutateAsync({
          classId,
          addMembers: selectedStudents.map((e) => e.user.id),
        });

        router.push(`/dashboard/class/${classId}`);
      } catch {
        setRowSelection({});
      }
    }
  };

  return (
    <>
      <DataTable
        columns={[
          {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
            enableHiding: false,
          },
          {
            accessorKey: "username",
            header: ({ column }) => {
              return <DataTableColumnHeader column={column} title="Username" />;
            },
          },
          {
            accessorKey: "email",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Email" />
            ),
          },
          {
            accessorKey: "role",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Role" />
            ),
          },
          {
            accessorKey: "classes",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Classes" />
            ),
            cell: ({ row }) => {
              const classes = row.getValue("classes") as Class[];

              const components = classes.map((c) => {
                return (
                  <Tooltip key={c.id}>
                    <TooltipTrigger>
                      <Badge>{c.name}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {c.description || "No description"}
                    </TooltipContent>
                  </Tooltip>
                );
              });

              return (
                <div className="flex flex-row flex-nowrap items-center gap-1">
                  {components}
                </div>
              );
            },
          },
          {
            accessorKey: "phoneNumber",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Phone number" />
            ),
          },
          {
            accessorKey: "createdAt",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Created at" />
            ),
            cell: ({ row }) => {
              const createdAt = row.getValue("createdAt") as string;

              const date = dayjs(createdAt).format("DD MMM YYYY");

              return <div>{date}</div>;
            },
          },
        ]}
        data={
          students?.map((e) => ({
            id: e?.user.id,
            username: e?.user.firstName + " " + e?.user.lastName,
            email: e?.user.email,
            role: e?.user.role,
            phoneNumber: e?.user.phoneNumber,
            classes: e?.classes,
            createdAt: e.user.createdAt,
          })) ?? []
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        tableComponents={
          <>
            <div className="ml-auto flex flex-row gap-4 justify-center items-center">
              {Object.keys(rowSelection).length > 0 && (
                <Button disabled={isPending} onClick={handleAddStudents}>
                  {isPending ? <Loader2Icon className="animate-spin" /> : null}
                  Add {Object.keys(rowSelection).length} students
                </Button>
              )}
            </div>
          </>
        }
      />
    </>
  );
}

export { AddClassMemberTable };
