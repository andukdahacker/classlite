"use client";

import { useGetClass } from "../hooks/use-get-class";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";

interface ClassDetailsStudentProps {
  classId: string;
}

function ClassDetailsStudent({ classId }: ClassDetailsStudentProps) {
  const { data, isPending, error } = useGetClass(classId);

  if (isPending) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;

  const { class: klass, classMembers } = data;
  const teachers = classMembers?.filter(m => m.user.role === 'TEACHER');
  const students = classMembers?.filter(m => m.user.role === 'STUDENT');
  
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
            <CardHeader><CardTitle>Teachers</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {teachers?.map(t => (
                <div key={t.user.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{getInitials(t.user.firstName, t.user.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{t.user.firstName} {t.user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{t.user.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Classmates</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students?.map(s => (
                <div key={s.user.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{getInitials(s.user.firstName, s.user.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{s.user.firstName} {s.user.lastName}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { ClassDetailsStudent };
