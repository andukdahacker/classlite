import { Assignment, Exercise, User } from "@workspace/types";

import { ExercisePreview } from "@/lib/features/exercises/components/preview/exercise-preview";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { HelpCircle, Type } from "lucide-react";

interface ViewAssignedAssignmentProps {
  exercise: Exercise;
  assignment: Assignment;
  student: User;
}

function ViewAssignedAssignment({
  exercise,
  assignment,
  student,
}: ViewAssignedAssignmentProps) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>
              Due on {new Date(assignment.dueDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline">{assignment.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Student</span>
              <span className="font-semibold">
                {student.firstName} {student.lastName}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <HelpCircle size={16} />
                Exercise Type
              </span>
              <Badge variant="secondary">{exercise.type}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Type size={16} />
                Exercise Name
              </span>
              <span className="font-semibold">{exercise.name}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Exercise Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ExercisePreview exercise={exercise} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { ViewAssignedAssignment };
