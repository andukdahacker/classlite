"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { EditIcon, Loader2Icon, SendIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import useDeleteExercise from "../hooks/use-delete-exercise";
import { useGetExercise } from "../hooks/use-get-exercise";
import { AssignExerciseDialog } from "./assign-exercise-dialog";
import { ExercisePreviewPage } from "./preview/exercise-preview-page";

interface ExerciseDetailsProps {
  id: string;
}

function ExerciseDetails({ id }: ExerciseDetailsProps) {
  const { data: exercise, isLoading } = useGetExercise(id);
  const navigate = useNavigate();
  const { mutate: deleteExercise } = useDeleteExercise();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return <div>Exercise not found</div>;
  }

  return (
    <>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{exercise.exercise.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/exercises/${id}/edit`)}
              >
                <EditIcon className="mr-2 h-4 w-4" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <TrashIcon className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the exercise.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteExercise(id)}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => setAssignDialogOpen(true)}>
                <SendIcon className="mr-2 h-4 w-4" /> Assign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Badge>{exercise.exercise.type}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[800px] border rounded-md overflow-hidden">
              <ExercisePreviewPage id={id} />
            </div>
          </CardContent>
        </Card>
      </div>
      <AssignExerciseDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        exerciseId={id}
        exerciseTitle={exercise.exercise.name}
      />
    </>
  );
}

export { ExerciseDetails };
