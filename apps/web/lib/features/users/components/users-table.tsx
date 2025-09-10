"use client";

import { Class, User } from "@/lib/schema/types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
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
import { useState } from "react";
import { useDeleteUser } from "../hooks/use-delete-user";
import { useGetUserList } from "../hooks/use-get-user-list";
import { AddUserButton } from "./add-user-button";
import { UpdateUserForm } from "./update-user-form";

function UsersTable() {
  const { data: users } = useGetUserList();

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { mutate, isPending } = useDeleteUser({
    onSuccess: () => {
      setOpenDeleteDialog(false);
    },
  });

  const router = useRouter();
  return (
    <>
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

              const date = dayjs(createdAt).format("DD MMM YYYY");

              return <div>{date}</div>;
            },
          },
          {
            id: "actions",
            cell: ({ row }) => {
              const userId = row.original.id;
              const user = users?.find((e) => e.user.id);
              return (
                <>
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
                          router.push(`/dashboard/users/${userId}`)
                        }
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <EyeIcon />
                          View
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedUser(user?.user!);
                          setOpenEditDialog(true);
                        }}
                        asChild
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <EditIcon />
                          Edit
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        asChild
                        onSelect={() => {
                          setSelectedUser(user?.user!);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <TrashIcon />
                          Delete
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
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
        tableComponents={
          <div className="ml-auto">
            <AddUserButton />
          </div>
        }
      />
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Edit user's information</DialogDescription>
          </DialogHeader>
          <UpdateUserForm
            user={selectedUser!}
            onUpdateUserSucess={() => setOpenEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>You're deleting a user.</DialogDescription>
          </DialogHeader>
          <span>Are you sure you want to delete this user?</span>
          <DialogFooter>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                mutate(selectedUser!.id);
              }}
              disabled={isPending}
            >
              {isPending ? <Loader2Icon className="animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { UsersTable };
