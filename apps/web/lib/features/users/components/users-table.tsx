"use client";

import { Class } from "@/lib/schema/types";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import dayjs from "dayjs";
import { MoreHorizontal } from "lucide-react";
import { useGetUserList } from "../hooks/use-get-user-list";

function UsersTable() {
  const { data: users } = useGetUserList();

  return (
    <DataTable
      columns={[
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

            const date = dayjs(createdAt);

            return <div>{date.toString()}</div>;
          },
        },
        {
          id: "actions",
          cell: ({ row }) => {
            const userId = row.original.id;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {}}>View</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ]}
      data={
        users?.map((e) => ({
          id: e?.user.id,
          username: e?.user.firstName + " " + e?.user.lastName,
          email: e?.user.email,
          role: e?.user.role,
          phoneNumber: e?.user.phoneNumber,
          classes: e?.classes,
          createdAt: e.user.createdAt,
        })) ?? []
      }
    />
  );
}

export { UsersTable };
