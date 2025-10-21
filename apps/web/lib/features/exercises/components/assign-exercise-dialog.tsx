import { CreateAssignmentsInput } from "@workspace/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { useContext, useState } from "react";
import { useCreateAssignments } from "../../assignments/hooks/use-create-assignment";
import { AuthContext } from "../../auth/components/auth-context";
import { useGetCenterClass } from "../../class/hooks/use-get-center-class";

interface AssignExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string;
  exerciseTitle: string;
}

type StudentSelection = { classId: string; userId: string };

function AssignExerciseDialog({
  open,
  onOpenChange,
  exerciseId,
  exerciseTitle,
}: AssignExerciseDialogProps) {
  const { center } = useContext(AuthContext);
  if (!center) return null;
  const { data: classes, isPending: isPendingGetCenterClass } =
    useGetCenterClass(center.id);

  const [selectedStudents, setSelectedStudents] = useState<StudentSelection[]>(
    [],
  );

  const handleClassCheckboxChange = (checked: boolean, classId: string) => {
    const classInfo = classes?.find((c) => c.class.id === classId);
    if (!classInfo) return;

    const studentsInClass = classInfo.members.map((m) => ({
      userId: m.id,
      classId,
    }));

    if (checked) {
      setSelectedStudents((prev) => {
        const newStudents = studentsInClass.filter(
          (student) =>
            !prev.some(
              (s) =>
                s.userId === student.userId && s.classId === student.classId,
            ),
        );
        return [...prev, ...newStudents];
      });
    } else {
      setSelectedStudents((prev) => prev.filter((s) => s.classId !== classId));
    }
  };

  const handleStudentCheckboxChange = (
    checked: boolean,
    studentSelection: StudentSelection,
  ) => {
    if (checked) {
      setSelectedStudents((prev) => [...prev, studentSelection]);
    } else {
      setSelectedStudents((prev) =>
        prev.filter(
          (s) =>
            s.userId !== studentSelection.userId ||
            s.classId !== studentSelection.classId,
        ),
      );
    }
  };

  const isClassSelected = (classId: string) => {
    const classInfo = classes?.find((c) => c.class.id === classId);
    if (!classInfo || classInfo.members.length === 0) return false;
    return classInfo.members.every((m) =>
      selectedStudents.some((s) => s.userId === m.id && s.classId === classId),
    );
  };

  const isStudentSelected = (studentSelection: StudentSelection) => {
    return selectedStudents.some(
      (s) =>
        s.userId === studentSelection.userId &&
        s.classId === studentSelection.classId,
    );
  };

  const { mutate: createAssignments, isPending } = useCreateAssignments({
    onSuccess: () => onOpenChange(false),
  });

  const handleAssign = () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const input: CreateAssignmentsInput = {
      exerciseId,
      title: exerciseTitle,
      students: selectedStudents,
    };
    createAssignments(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Assign "{exerciseTitle}"</DialogTitle>
          <DialogDescription>
            Select classes or individual students to assign this exercise to.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 rounded-md border">
          <Accordion type="multiple" className="w-full pl-2 pr-2">
            {isPendingGetCenterClass ? (
              <p className="p-4">Loading classes...</p>
            ) : (
              classes?.map((c) => (
                <AccordionItem value={c.class.id} key={c.class.id}>
                    <div className="flex items-center w-full border-b">
                        <div className="p-4">
                            <Checkbox
                                checked={isClassSelected(c.class.id)}
                                onCheckedChange={(checked) =>
                                handleClassCheckboxChange(Boolean(checked), c.class.id)
                                }
                            />
                        </div>
                        <AccordionTrigger className="flex-grow text-left justify-start">
                            {c.class.name}
                        </AccordionTrigger>
                    </div>
                    <AccordionContent>
                    {c.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-2 p-2 ml-4"
                      >
                        <Checkbox
                          checked={isStudentSelected({
                            userId: member.id,
                            classId: c.class.id,
                          })}
                          onCheckedChange={(checked) =>
                            handleStudentCheckboxChange(Boolean(checked), {
                              userId: member.id,
                              classId: c.class.id,
                            })
                          }
                        />
                        <label>
                          {member.firstName} {member.lastName}
                        </label>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))
            )}
          </Accordion>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isPending}>
            {isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AssignExerciseDialog };
