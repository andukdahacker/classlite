"use client";

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useGetStudentClass } from "../hooks/use-get-student-class";
import { StudentAssignmentsTable } from "./student-assignments-table";

interface ClassDetailsStudentProps {
  classId: string;
}

function ClassDetailsStudent({ classId }: ClassDetailsStudentProps) {
  const { data, isPending, error } = useGetStudentClass(classId);

  if (isPending) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;

  const { class: klass, teachers, assignments } = data;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{klass.name}</CardTitle>
          <p className="text-muted-foreground">{klass.description}</p>
        </CardHeader>
      </Card>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teachers?.map((t) => (
                <div key={t.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(t.firstName, t.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {t.firstName} {t.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentAssignmentsTable assignments={assignments} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { ClassDetailsStudent };
