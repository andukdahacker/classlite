"use client";

import { User } from "@workspace/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
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
import dayjs from "dayjs";
import {
  EyeIcon,
  Loader2Icon,
  MoreHorizontal,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../../auth/components/auth-context";
import { useDeleteClass } from "../hooks/use-delete-class";
import useGetClassListByUser from "../hooks/use-get-class-by-user";

interface UserClassTableProps {
  userId: string;
}

type ClassData = {
  id: string;
  className: string;
  description: string | null;
  students: User[];
  teachers: User[];
  enrolledAt: string;
};

function UserClassTable({ userId }: UserClassTableProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const { mutateAsync: deleteClass, isPending: isPendingDeleteClass } =
    useDeleteClass();

  const handleDeleteClass = async () => {
    if (selectedClass) {
      await deleteClass(selectedClass.id);
      setDeleteModalOpen(false);
      setSelectedClass(null);
    }
  };

  const { data, isPending, error } = useGetClassListByUser(userId);

  const columns: ColumnDefinition<ClassData>[] = useMemo(() => {
    const baseColumns: ColumnDefinition<ClassData>[] = [
      {
        accessorKey: "className",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Class Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("className")}</div>
        ),
      },
    ];

    if (user.role !== "STUDENT") {
      baseColumns.push({
        accessorKey: "students",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Students" />
        ),
        cell: ({ row }) => {
          const students = row.getValue("students") as User[];
          const firstThree = students.slice(0, 3);

          return (
            <div className="flex items-center -space-x-2">
              {firstThree.map((student) => (
                <Avatar key={student.id} className="border-2 border-background">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>
                    {student.firstName?.charAt(0).toUpperCase()}
                    {student.lastName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {students.length > 3 && (
                <Avatar className="border-2 border-background">
                  <AvatarFallback>+{students.length - 3}</AvatarFallback>
                </Avatar>
              )}
              {students.length === 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  No students
                </div>
              )}
            </div>
          );
        },
      });
    }

    baseColumns.push(
      {
        accessorKey: "teachers",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Teachers" />
        ),
        cell: ({ row }) => {
          const teachers = row.getValue("teachers") as User[];
          return (
            <div className="flex items-center -space-x-2">
              {teachers.map((teacher) => (
                <Avatar key={teacher.id} className="border-2 border-background">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>
                    {teacher.firstName?.charAt(0).toUpperCase()}
                    {teacher.lastName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {teachers.length === 0 && (
                <div className="text-sm text-muted-foreground">No teachers</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "enrolledAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Enrolled at" />
        ),
        cell: ({ row }) => (
          <div className="hidden md:table-cell">
            {dayjs(row.getValue("enrolledAt")).format("DD MMM YYYY")}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const klass = row.original;
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
                  onSelect={() => router.push(`/dashboard/class/${klass.id}`)}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                {user.role !== "STUDENT" && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedClass(klass);
                      setDeleteModalOpen(true);
                    }}
                    className="text-red-500"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete class
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    );

    return baseColumns;
  }, [router, user.role]);

  const tableData: ClassData[] = useMemo(
    () =>
      data?.map((klass) => ({
        id: klass.class.id,
        className: klass.class.name,
        description: klass.class.description,
        students: klass.members.filter((m) => m.role === "STUDENT"),
        teachers: klass.members.filter((m) => m.role === "TEACHER"),
        enrolledAt: klass.enrolledAt as string,
      })) ?? [],
    [data],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
          <CardDescription>
            Here are the classes you are enrolled in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex justify-center items-center h-64">
              <Loader2Icon className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center h-64 flex justify-center items-center">
              Error loading classes: {error.message}
            </div>
          ) : (
            <DataTable columns={columns} data={tableData} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this class?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              class and all of its associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClass}
              disabled={isPendingDeleteClass}
            >
              {isPendingDeleteClass && (
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

export { UserClassTable };
