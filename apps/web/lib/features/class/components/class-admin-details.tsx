"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import dayjs from "dayjs";
import { EyeIcon, MoreHorizontal, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetClass } from "../hooks/use-get-class";
import useUpdateClass from "../hooks/use-update-class";
import { DeleteClassDialog } from "./delete-class-dialog";
import { UpdateClassDialog } from "./update-class-dialog";

interface ClassDetailsProps {
  classId: string;
}

function ClassDetailsAdmin({ classId }: ClassDetailsProps) {
  const [rowSelection, setRowSelection] = useState({});
  const { mutateAsync: updateClass, isPending: isPendingUpdateClass } =
    useUpdateClass();
  const { data, isPending, error } = useGetClass(classId);

  const router = useRouter();

  if (isPending) {
    return <>Loading...</>;
  }

  if (error) {
    return <>Error: {error.message}</>;
  }

  const klass = data.class;

  const students =
    data.classMembers?.filter((user) => user.user.role == "STUDENT") ?? [];

  const teachers =
    data.classMembers?.filter((user) => user.user.role == "TEACHER") ?? [];

  const handleRemove = async (userId: string) => {
    await updateClass({
      classId,
      removeMembers: [userId],
    });
  };

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex justify-between flex-row">
        <div>
          <h2 className="text-2xl font-bold">{klass.name}</h2>
          <p className="text-gray-600">{klass.description}</p>
        </div>
        <div className="flex flex-row gap-2">
          <UpdateClassDialog klass={klass} />
          <DeleteClassDialog classId={classId} />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2">Class Members</h3>

      <div className="flex flex-col gap-4">
        <h4 className="text-lg font-medium">Teachers</h4>
        <div className="flex flex-wrap gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.user.id}
              className="border p-2 rounded-md shadow-sm"
            >
              <div>
                <p className="font-semibold">
                  {teacher.user.firstName} {teacher.user.lastName}
                </p>
                <p className="text-sm text-gray-600">{teacher.user.email}</p>
              </div>

              <div className="mt-2">
                <Link
                  href={`/dashboard/users/${teacher.user.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Profile
                </Link>

                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => handleRemove(teacher.user.id)}
                  disabled={isPendingUpdateClass}
                >
                  {isPendingUpdateClass ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
            header: "Student Name",
            accessorKey: "studentName",
          },
          {
            header: "Email",
            accessorKey: "email",
          },
          {
            header: "Joined At",
            accessorKey: "joinedAt",
          },
          {
            id: "actions",
            cell: ({ row }) => {
              const userId = row.original.id;
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
                        onSelect={() => {
                          router.push(`/dashboard/user/${userId}`);
                        }}
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <EyeIcon />
                          View
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRemove(userId)}>
                        <div className="flex flex-row gap-2 items-center">
                          <Trash2Icon />
                          Remove
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              );
            },
          },
        ]}
        data={students.map((cm) => ({
          id: cm.user.id,
          studentName: cm.user.firstName + " " + cm.user.lastName,
          email: cm.user.email,
          joinedAt: dayjs(cm.user.createdAt as string).format("DD MM YYYY"),
        }))}
        tableComponents={
          <>
            <div className="ml-auto">
              {rowSelection && Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="destructive"
                  className="mr-2"
                  onClick={async () => {
                    const selectedStudents = Object.keys(rowSelection).map(
                      (key) => {
                        return students[parseInt(key)]!;
                      },
                    );
                    const userIds = selectedStudents.map((s) => s.user.id);
                    await updateClass({
                      classId,
                      removeMembers: userIds,
                    });
                    setRowSelection({});
                  }}
                  disabled={isPendingUpdateClass}
                >
                  {isPendingUpdateClass ? "Removing..." : "Remove selected"}
                </Button>
              )}
              <Button
                onClick={() =>
                  router.push(`/dashboard/class/${classId}/add-members`)
                }
              >
                Add members
              </Button>
            </div>
          </>
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}

export { ClassDetailsAdmin };
