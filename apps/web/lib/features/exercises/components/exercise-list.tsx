"use client";

import useDebounce from "@/lib/core/hooks/use-debounce";
import { ExerciseType } from "@workspace/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  EditIcon,
  EyeIcon,
  ListFilter,
  Loader2Icon,
  MoreHorizontal,
  RefreshCw,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useCreateExercise from "../hooks/use-create-exercise";
import useDeleteExercise from "../hooks/use-delete-exercise";
import useGetExerciseList from "../hooks/use-get-exercise-list";

import { AssignExerciseDialog } from "./assign-exercise-dialog";

function ExerciseTable() {
  const [searchString, setSearchString] = useState("");
  const debouncedSearchString = useDebounce(searchString, 500);
  const [selected, setSelected] = useState<number[]>([]);
  const router = useRouter();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

  const {
    data,
    status,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetExerciseList(debouncedSearchString);

  const { mutate: createExericse, isPending: isPendingCreateExercise } =
    useCreateExercise({
      onSuccess: (data) => {
        router.push(`/dashboard/exercises/${data.exercise.id}/edit`);
      },
    });

  const { mutate: deleteExercise } = useDeleteExercise();

  const handleCreateExercise = (type: ExerciseType) => {
    if (isPendingCreateExercise) return;
    createExericse({
      content: "",
      name: "Untitled exercise",
      type,
    });
  };

  const exercises = data?.pages
    .flat()
    .map((e) => e?.nodes)
    .flat();

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center gap-2">
          <div className="flex flex-row gap-2">
            <Input
              className="max-w-sm"
              placeholder="Search exercises..."
              value={searchString}
              onChange={(event) => setSearchString(event.target.value)}
            />
            <Button
              onClick={() => refetch()}
              disabled={isRefetching || status == "pending"}
            >
              <RefreshCw
                className={
                  isRefetching || status == "pending" ? "animate-spin" : ""
                }
              />
            </Button>
            <Button>
              <ListFilter />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isPendingCreateExercise}>
                {isPendingCreateExercise ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  "Create exercise"
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuLabel>Pick a type of exercise</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => handleCreateExercise("READING")}
              >
                Reading
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => handleCreateExercise("LISTENING")}
              >
                Listening
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => handleCreateExercise("WRITING")}
              >
                Writing
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => handleCreateExercise("SPEAKING")}
              >
                Speaking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={
                      selected.length > 0 &&
                      selected.length == exercises?.length
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelected([...Array(exercises?.length).keys()]);
                      } else {
                        setSelected([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status == "pending" ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : status == "error" ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {error.message}
                  </TableCell>
                </TableRow>
              ) : exercises?.length == 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No results.
                  </TableCell>
                </TableRow>
              ) : (
                exercises?.map((e, i) => (
                  <TableRow key={e?.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(i)}
                        onCheckedChange={(value) => {
                          if (value) {
                            const current = [...selected];
                            current.push(i);
                            setSelected(current);
                          } else {
                            const current = [...selected];
                            const removed = current.filter((e) => e !== i);
                            setSelected(removed);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{e?.name}</TableCell>
                    <TableCell>{e?.type}</TableCell>
                    <TableCell>
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
                              router.push(`/dashboard/exercises/${e?.id}`);
                            }}
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <EyeIcon />
                              View
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => {
                              router.push(`/dashboard/exercises/${e?.id}/edit`);
                            }}
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <EditIcon />
                              Edit
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => {
                              if (!e?.id || !e?.name) return;
                              setSelectedExercise({ id: e.id, name: e.name });
                              setAssignDialogOpen(true);
                            }}
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <SendIcon />
                              Assign
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() => {
                              if (!e?.id) return;
                              setExerciseToDelete(e.id);
                              setDeleteConfirmDialogOpen(true);
                            }}
                          >
                            <div className="flex flex-row gap-2 items-center">
                              <TrashIcon />
                              Delete
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {hasNextPage ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    End of list
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {selectedExercise && (
        <AssignExerciseDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          exerciseId={selectedExercise.id}
          exerciseTitle={selectedExercise.name}
        />
      )}

      <AlertDialog
        open={deleteConfirmDialogOpen}
        onOpenChange={setDeleteConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              exercise.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (exerciseToDelete) {
                  deleteExercise(exerciseToDelete);
                  setExerciseToDelete(null);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { ExerciseTable };
