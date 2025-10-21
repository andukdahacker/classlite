"use client";

import { Class, User } from "@workspace/types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ColumnDefinition } from "@workspace/ui/components/lazy-data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import dayjs from "dayjs";
import {
  EditIcon,
  EyeIcon,
  Loader2Icon,
  MoreHorizontal,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDeleteUser } from "../hooks/use-delete-user";
import { useGetUserList } from "../hooks/use-get-user-list";
import { AddUserButton } from "./add-user-button";
import { UpdateUserForm } from "./update-user-form";

type UserData = {
  id: string;
  username: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  classes: Class[];
  createdAt: string;
  user: User;
};

function UsersTable() {
  const { data: users } = useGetUserList();

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { mutate, isPending } = useDeleteUser({
    onSuccess: () => {
      setOpenDeleteDialog(false);
      setSelectedUser(null);
    },
  });

  const router = useRouter();

  const columns: ColumnDefinition<UserData>[] = useMemo(
    () => [
      {
        accessorKey: "username",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Username" />
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <div className="hidden lg:table-cell">{row.getValue("email")}</div>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => <Badge>{row.getValue("role")}</Badge>,
      },
      {
        accessorKey: "classes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Classes" />
        ),
        cell: ({ row }) => {
          const classes = row.getValue("classes") as Class[];
          return (
            <div className="flex flex-row flex-nowrap items-center gap-1">
              {classes.map((c) => (
                <Tooltip key={c.id}>
                  <TooltipTrigger>
                    <Badge variant="secondary">{c.name}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {c.description || "No description"}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "phoneNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Phone number" />
        ),
        cell: ({ row }) => (
          <div className="hidden md:table-cell">
            {row.getValue("phoneNumber")}
          </div>
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
          return <div className="hidden md:table-cell">{date}</div>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedUser(user.user);
                    setOpenEditDialog(true);
                  }}
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedUser(user.user);
                    setOpenDeleteDialog(true);
                  }}
                  className="text-red-500"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router],
  );

  const tableData = useMemo(
    () =>
      users?.map((e) => ({
        id: e.user.id,
        username: `${e.user.firstName} ${e.user.lastName}`,
        email: e.user.email,
        role: e.user.role,
        phoneNumber: e.user.phoneNumber,
        classes: e.classes,
        createdAt: e.user.createdAt as string,
        user: e.user,
      })) ?? [],
    [users],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage your users and view their details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tableData}
            tableComponents={
              <div className="ml-auto">
                <AddUserButton />
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Make changes to the user profile here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UpdateUserForm
              user={selectedUser}
              onUpdateUserSucess={() => setOpenEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              user account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && mutate(selectedUser.id)}
              disabled={isPending}
            >
              {isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { UsersTable };
