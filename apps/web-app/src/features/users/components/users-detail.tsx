"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ChevronDownIcon } from "lucide-react";
import { useGetUser } from "../hooks/use-get-user";

interface UserDetailsProps {
  id: string;
}

function UserDetails({ id }: UserDetailsProps) {
  const { data, isPending, error } = useGetUser(id);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  };

  const totalClasses = data.classes?.length ?? 0;
  let totalAssignments = 0;
  let submissionsAwaitingFeedback = 0;

  if (data.user.role === "STUDENT") {
    totalAssignments =
      data.classes?.reduce(
        (acc, classMember) => acc + (classMember.assignments?.length ?? 0),
        0
      ) ?? 0;
    submissionsAwaitingFeedback =
      data.classes?.reduce(
        (acc, classMember) =>
          acc +
          (classMember.assignments?.filter((a) => a.status === "SUBMITTED")
            .length ?? 0),
        0
      ) ?? 0;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={undefined}
                alt={`${data.user.firstName} ${data.user.lastName}`}
              />
              <AvatarFallback>
                {getInitials(data.user.firstName, data.user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">
                {data.user.firstName} {data.user.lastName}
              </h2>
              <p className="text-muted-foreground">{data.user.username}</p>
              <Badge>{data.user.role}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p>{data.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Phone Number
              </p>
              <p>{data.user.phoneNumber ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Center ID
              </p>
              <p>{data.user.centerId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Joined At
              </p>
              <p>{new Date(data.user.createdAt as string).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-card p-4 text-card-foreground">
              <p className="text-sm font-medium text-muted-foreground">
                Total Classes
              </p>
              <p className="text-2xl font-bold">{totalClasses}</p>
            </div>
            {data.user.role === "STUDENT" && (
              <>
                <div className="rounded-lg border bg-card p-4 text-card-foreground">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Assignments
                  </p>
                  <p className="text-2xl font-bold">{totalAssignments}</p>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground">
                  <p className="text-sm font-medium text-muted-foreground">
                    Awaiting Feedback
                  </p>
                  <p className="text-2xl font-bold">
                    {submissionsAwaitingFeedback}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {data.classes && data.classes.length > 0 ? (
            <div className="space-y-4">
              {(data.classes as any[]).map((classMember) => (
                <Collapsible key={classMember.class.id}>
                  <div className="flex items-center justify-between rounded-md border px-4 py-2">
                    <h3 className="text-lg font-semibold">
                      {classMember.class.name}
                    </h3>
                    {data.user.role === "STUDENT" && (
                      <CollapsibleTrigger>
                        <ChevronDownIcon className="h-5 w-5" />
                      </CollapsibleTrigger>
                    )}
                  </div>
                  {data.user.role === "STUDENT" && (
                    <CollapsibleContent className="p-4">
                      <h4 className="mb-2 text-md font-semibold">
                        Assignments
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Submitted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classMember.assignments?.map((assignment: any) => (
                            <TableRow key={assignment.id}>
                              <TableCell>{assignment.title}</TableCell>
                              <TableCell>
                                <Badge>{assignment.status}</Badge>
                              </TableCell>
                              <TableCell>
                                {assignment.dueDate
                                  ? new Date(
                                      assignment.dueDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                {assignment.submission ? "Yes" : "No"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              ))}
            </div>
          ) : (
            <p>This user is not enrolled in any classes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { UserDetails };
