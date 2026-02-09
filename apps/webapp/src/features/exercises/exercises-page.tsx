import { useAuth } from "@/features/auth/auth-context";
import type { Exercise, ExerciseSkill, ExerciseStatus, BandLevel } from "@workspace/types";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
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
import {
  Book,
  Check,
  ChevronsUpDown,
  Headphones,
  Loader2,
  Mic,
  MoreHorizontal,
  Pen,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useExercises } from "./hooks/use-exercises";
import { useTags } from "./hooks/use-tags";

const SKILL_ICONS: Record<ExerciseSkill, React.ReactNode> = {
  READING: <Book className="size-4" />,
  LISTENING: <Headphones className="size-4" />,
  WRITING: <Pen className="size-4" />,
  SPEAKING: <Mic className="size-4" />,
};

const SKILL_LABELS: Record<ExerciseSkill, string> = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

const STATUS_VARIANTS: Record<
  ExerciseStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  PUBLISHED: {
    label: "Published",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-muted/50 text-muted-foreground/70",
  },
};

export function ExercisesPage() {
  const { user } = useAuth();
  const centerId = user?.centerId || undefined;
  const navigate = useNavigate();

  const [skillFilter, setSkillFilter] = useState<ExerciseSkill | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ExerciseStatus | "ALL">(
    "ALL",
  );
  const [bandLevelFilter, setBandLevelFilter] = useState<BandLevel | "ALL">("ALL");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const { tags: centerTags } = useTags(centerId);

  const filters = useMemo(() => {
    const f: {
      skill?: ExerciseSkill;
      status?: ExerciseStatus;
      bandLevel?: BandLevel;
      tagIds?: string;
    } = {};
    if (skillFilter !== "ALL") f.skill = skillFilter;
    if (statusFilter !== "ALL") f.status = statusFilter;
    if (bandLevelFilter !== "ALL") f.bandLevel = bandLevelFilter;
    if (tagFilter.length > 0) f.tagIds = tagFilter.join(",");
    return f;
  }, [skillFilter, statusFilter, bandLevelFilter, tagFilter]);

  const {
    exercises,
    isLoading,
    deleteExercise,
    isDeleting,
    publishExercise,
    archiveExercise,
  } = useExercises(centerId, filters);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises;
    const query = searchQuery.toLowerCase();
    return exercises.filter((ex) => ex.title.toLowerCase().includes(query));
  }, [exercises, searchQuery]);

  const handleCreate = () => {
    navigate("../exercises/new");
  };

  const handleEdit = (exercise: Exercise) => {
    navigate(`../exercises/${exercise.id}/edit`);
  };

  const handleDeleteClick = (exercise: Exercise) => {
    if (exercise.status !== "DRAFT") {
      toast.error("Only draft exercises can be deleted");
      return;
    }
    setDeleteTarget(exercise);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExercise(deleteTarget.id);
      toast.success("Exercise deleted successfully");
    } catch {
      toast.error("Failed to delete exercise");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePublish = async (exercise: Exercise) => {
    try {
      await publishExercise(exercise.id);
      toast.success("Exercise published successfully");
    } catch {
      toast.error("Failed to publish exercise");
    }
  };

  const handleArchive = async (exercise: Exercise) => {
    try {
      await archiveExercise(exercise.id);
      toast.success("Exercise archived successfully");
    } catch {
      toast.error("Failed to archive exercise");
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="text-muted-foreground">
            Create and manage IELTS exercises for your students.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Exercise
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={skillFilter}
          onValueChange={(v) => setSkillFilter(v as ExerciseSkill | "ALL")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Skills</SelectItem>
            <SelectItem value="READING">Reading</SelectItem>
            <SelectItem value="LISTENING">Listening</SelectItem>
            <SelectItem value="WRITING">Writing</SelectItem>
            <SelectItem value="SPEAKING">Speaking</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ExerciseStatus | "ALL")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={bandLevelFilter}
          onValueChange={(v) => setBandLevelFilter(v as BandLevel | "ALL")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Bands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Bands</SelectItem>
            <SelectItem value="4-5">Band 4-5</SelectItem>
            <SelectItem value="5-6">Band 5-6</SelectItem>
            <SelectItem value="6-7">Band 6-7</SelectItem>
            <SelectItem value="7-8">Band 7-8</SelectItem>
            <SelectItem value="8-9">Band 8-9</SelectItem>
          </SelectContent>
        </Select>
        <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tagPopoverOpen}
              className="w-[180px] justify-between"
            >
              {tagFilter.length > 0
                ? `${tagFilter.length} tag${tagFilter.length > 1 ? "s" : ""}`
                : "All Tags"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                {centerTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      setTagFilter((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id],
                      );
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        tagFilter.includes(tag.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead>Band</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExercises.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {exercises.length === 0
                    ? "No exercises found. Create one to get started."
                    : "No exercises match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredExercises.map((exercise) => (
                <TableRow key={exercise.id}>
                  <TableCell className="font-medium">
                    {exercise.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {SKILL_ICONS[exercise.skill]}
                      <span>{SKILL_LABELS[exercise.skill]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {exercise.bandLevel ? (
                      <Badge variant="outline">{exercise.bandLevel}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exercise.tags?.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{exercise.sections?.length ?? 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_VARIANTS[exercise.status]?.className}
                    >
                      {STATUS_VARIANTS[exercise.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(exercise.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(exercise)}>
                          Edit
                        </DropdownMenuItem>
                        {exercise.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => handlePublish(exercise)}
                          >
                            Publish
                          </DropdownMenuItem>
                        )}
                        {exercise.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => handleArchive(exercise)}
                          >
                            Archive
                          </DropdownMenuItem>
                        )}
                        {exercise.status === "DRAFT" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={isDeleting}
                              onClick={() => handleDeleteClick(exercise)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
