import { useAuth } from "@/features/auth/auth-context";
import { RBACWrapper } from "@/features/auth/components/RBACWrapper";
import type { Class } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Edit2, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RosterManager } from "./components/RosterManager";
import { ClassDrawer } from "./components/ClassDrawer";
import { useClasses } from "./hooks/use-logistics";

export const ClassesPage = () => {
  const { user } = useAuth();
  const { classes, isLoading, deleteClass } = useClasses(
    user?.centerId || undefined,
  );
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRoster = (cls: Class) => {
    setSelectedClass(cls);
    setRosterOpen(true);
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setDrawerOpen(true);
  };

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteClass(id);
        toast.success("Class deleted successfully");
      } catch (error) {
        toast.error("Failed to delete class");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            Manage your class rosters and student assignments.
          </p>
        </div>
        <RBACWrapper requiredRoles={["OWNER", "ADMIN"]}>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 size-4" />
            New Class
          </Button>
        </RBACWrapper>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No classes found.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.course?.name || "N/A"}</TableCell>
                  <TableCell>{cls.studentCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <RBACWrapper requiredRoles={["OWNER", "ADMIN"]}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoster(cls)}
                        >
                          <Users className="mr-2 size-4" />
                          Roster
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cls)}
                        >
                          <Edit2 className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cls.id)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </RBACWrapper>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Roster: {selectedClass?.name} ({selectedClass?.course?.name})
            </DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <RosterManager
              classId={selectedClass.id}
              centerId={user?.centerId || ""}
            />
          )}
        </DialogContent>
      </Dialog>

      <ClassDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        cls={selectedClass}
        centerId={user?.centerId || ""}
      />
    </div>
  );
};

export default ClassesPage;
