import { useAuth } from "@/features/auth/auth-context";
import type { MockTest } from "@workspace/types";
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useMockTests } from "./hooks/use-mock-tests";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

const TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: "Academic",
  GENERAL_TRAINING: "General Training",
};

export function MockTestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const centerId = user?.centerId || undefined;

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [testTypeFilter, setTestTypeFilter] = useState<string | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MockTest | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newTestType, setNewTestType] = useState("ACADEMIC");
  const [newDescription, setNewDescription] = useState("");

  const {
    mockTests,
    isLoading,
    createMockTest,
    isCreating,
    deleteMockTest,
    publishMockTest,
    archiveMockTest,
  } = useMockTests(centerId, {
    status: statusFilter,
    testType: testTypeFilter,
  });

  const handleCreate = async () => {
    try {
      const created = await createMockTest({
        title: newTitle,
        testType: newTestType as "ACADEMIC" | "GENERAL_TRAINING",
        description: newDescription || undefined,
      });
      setShowCreateDialog(false);
      setNewTitle("");
      setNewTestType("ACADEMIC");
      setNewDescription("");
      toast.success("Mock test created");
      navigate(`../mock-tests/${created.id}/edit`);
    } catch {
      toast.error("Failed to create mock test");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMockTest(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Mock test deleted");
    } catch {
      toast.error("Failed to delete mock test");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishMockTest(id);
      toast.success("Mock test published");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish";
      toast.error(msg);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMockTest(id);
      toast.success("Mock test archived");
    } catch {
      toast.error("Failed to archive mock test");
    }
  };

  const getSectionSummary = (mockTest: MockTest) => {
    if (!mockTest.sections) return "";
    return mockTest.sections
      .map((s) => {
        const count = s.exercises?.length ?? 0;
        return `${s.skill.charAt(0)}:${count}`;
      })
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mock Tests</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Mock Test
        </Button>
      </div>

      <div className="flex gap-3">
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={testTypeFilter ?? "all"}
          onValueChange={(v) => setTestTypeFilter(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Test Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ACADEMIC">Academic</SelectItem>
            <SelectItem value="GENERAL_TRAINING">General Training</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : mockTests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No mock tests yet. Create your first mock test to simulate full IELTS
          conditions.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Test Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTests.map((mt) => (
              <TableRow
                key={mt.id}
                className="cursor-pointer"
                onClick={() => navigate(`../mock-tests/${mt.id}/edit`)}
              >
                <TableCell className="font-medium">{mt.title}</TableCell>
                <TableCell>
                  {TEST_TYPE_LABELS[mt.testType] ?? mt.testType}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[mt.status] ?? "secondary"}>
                    {mt.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {getSectionSummary(mt)}
                </TableCell>
                <TableCell>{mt.createdBy?.name ?? "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={() => navigate(`../mock-tests/${mt.id}/edit`)}
                      >
                        Edit
                      </DropdownMenuItem>
                      {mt.status === "DRAFT" && (
                        <DropdownMenuItem
                          onClick={() => handlePublish(mt.id)}
                        >
                          Publish
                        </DropdownMenuItem>
                      )}
                      {mt.status !== "ARCHIVED" && (
                        <DropdownMenuItem
                          onClick={() => handleArchive(mt.id)}
                        >
                          Archive
                        </DropdownMenuItem>
                      )}
                      {mt.status === "DRAFT" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(mt)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Mock Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., IELTS Academic Practice Test 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select value={newTestType} onValueChange={setNewTestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACADEMIC">Academic</SelectItem>
                  <SelectItem value="GENERAL_TRAINING">
                    General Training
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete mock test?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.title}&quot;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
