"use client";

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import dayjs from "dayjs";
import { EyeIcon, MoreHorizontal, Trash2Icon, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetClass } from "../hooks/use-get-class";
import useUpdateClass from "../hooks/use-update-class";
import { AssignmentsTable } from "./assignments-table";
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
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4">Error: {error.message}</div>;
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

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{klass.name}</CardTitle>
            <p className="text-muted-foreground">{klass.description}</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <UpdateClassDialog klass={klass} />
            <DeleteClassDialog classId={classId} />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teachers.map((teacher) => (
                <div
                  key={teacher.user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(
                          teacher.user.firstName,
                          teacher.user.lastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {teacher.user.firstName} {teacher.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.user.email}
                      </p>
                    </div>
                  </div>
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
                          router.push(`/dashboard/users/${teacher.user.id}`)
                        }
                      >
                        <EyeIcon className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemove(teacher.user.id)}
                        disabled={isPendingUpdateClass}
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
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
                                router.push(`/dashboard/users/${userId}`);
                              }}
                            >
                              <EyeIcon className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(userId)}
                              disabled={isPendingUpdateClass}
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    },
                  },
                ]}
                data={students.map((cm) => ({
                  id: cm.user.id,
                  studentName: `${cm.user.firstName} ${cm.user.lastName}`,
                  email: cm.user.email,
                  joinedAt: dayjs(cm.user.createdAt as string).format(
                    "DD MMM YYYY",
                  ),
                }))}
                tableComponents={
                  <div className="flex items-center gap-2">
                    {Object.keys(rowSelection).length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          const selectedStudents = Object.keys(
                            rowSelection,
                          ).map((key) => students[parseInt(key)]!);
                          const userIds = selectedStudents.map(
                            (s) => s.user.id,
                          );
                          await updateClass({
                            classId,
                            removeMembers: userIds,
                          });
                          setRowSelection({});
                        }}
                        disabled={isPendingUpdateClass}
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" /> Remove selected
                        ({Object.keys(rowSelection).length})
                      </Button>
                    )}
                    <Button
                      className="ml-auto"
                      onClick={() =>
                        router.push(`/dashboard/class/${classId}/add-members`)
                      }
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Add members
                    </Button>
                  </div>
                }
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Assignments</CardTitle>
            <p className="text-muted-foreground">
              An overview of all assignments for students in this class.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <AssignmentsTable classMembers={data?.classMembers ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

export { ClassDetailsAdmin };
