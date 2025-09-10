import { User } from "@/lib/schema/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import dayjs from "dayjs";
import { EyeIcon, Loader2Icon, MoreHorizontal, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeleteClass } from "../hooks/use-delete-class";
import { useGetCenterClass } from "../hooks/use-get-center-class";
import { AddClassButton } from "./add-class-button";

interface CenterClassTableProps {
  centerId: string;
}

function CenterClassTable({ centerId }: CenterClassTableProps) {
  const router = useRouter();

  const { mutateAsync: deleteClass, isPending: isPendingDeleteClass } =
    useDeleteClass();

  const handleDeleteClass = async (classId: string) => {
    await deleteClass(classId);
  };

  const {
    data,
    isPending: isPendingGetCenterClass,
    error: getCenterClassError,
  } = useGetCenterClass(centerId);

  if (isPendingGetCenterClass) {
    return <Loader2Icon className="animate-spin" />;
  }

  if (getCenterClassError) {
    return <div>Error loading classes: {getCenterClassError.message}</div>;
  }

  const classes = data ?? [];

  return (
    <>
      <DataTable
        columns={[
          {
            accessorKey: "className",
            header: ({ column }) => {
              return (
                <DataTableColumnHeader column={column} title="Class Name" />
              );
            },
          },
          {
            accessorKey: "students",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Students" />
            ),
            cell: ({ row }) => {
              const students = row.getValue("students") as Array<User>;

              const firstThree = students.slice(0, 2);

              return (
                <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                  {firstThree.map((e) => (
                    <Avatar key={e.id}>
                      <AvatarImage />
                      <AvatarFallback>
                        {e.firstName?.at(0)?.toUpperCase()}
                        {e.lastName?.at(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {students.length > 3 && (
                    <Avatar>
                      <AvatarImage />
                      <AvatarFallback>+ {students.length - 3}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            },
          },
          {
            accessorKey: "teachers",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Teachers" />
            ),
            cell: ({ row }) => {
              const teachers = row.getValue("teachers") as Array<User>;

              return (
                <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                  {teachers.map((e) => (
                    <Avatar key={e.id}>
                      <AvatarImage />
                      <AvatarFallback>
                        {e.firstName?.at(0)?.toUpperCase()}
                        {e.lastName?.at(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              );
            },
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
              const klassId = row.original.id;
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
                          router.push(`/dashboard/class/${klassId}`);
                        }}
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <EyeIcon />
                          View details
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleDeleteClass(klassId)}
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <TrashIcon />
                          Delete class
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
          classes.map((e) => ({
            id: e.class.id,
            className: e.class.name,
            description: e.class.description,
            students: e.members.filter((e) => e.role == "STUDENT"),
            teachers: e.members.filter((e) => e.role == "TEACHER"),
            createdAt: e.class.createdAt,
          })) ?? []
        }
        tableComponents={
          <div className="ml-auto">
            <AddClassButton centerId={centerId} />
          </div>
        }
      />
    </>
  );
}

export { CenterClassTable };
