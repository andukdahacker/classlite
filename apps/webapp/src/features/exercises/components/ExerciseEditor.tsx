import { useAuth } from "@/features/auth/auth-context";
import { useExercise, useExercises } from "../hooks/use-exercises";
import { useSections } from "../hooks/use-sections";
import type {
  ExerciseSkill,
  IeltsQuestionType,
  CreateQuestionInput,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
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
import {
  ArrowLeft,
  Eye,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PassageEditor } from "./PassageEditor";
import { QuestionSectionEditor } from "./QuestionSectionEditor";
import { SkillSelector } from "./SkillSelector";
import type { Exercise } from "@workspace/types";

// Default first question type per skill
const DEFAULT_SECTION_TYPE: Record<ExerciseSkill, IeltsQuestionType> = {
  READING: "R1_MCQ_SINGLE",
  LISTENING: "L1_FORM_NOTE_TABLE",
  WRITING: "W1_TASK1_ACADEMIC",
  SPEAKING: "S1_PART1_QA",
};

type SaveStatus = "saved" | "saving" | "unsaved";

interface ExercisePreviewProps {
  title: string;
  instructions: string;
  passageContent: string;
  showPassage: boolean;
  sections: Exercise["sections"];
  onBack: () => void;
}

function ExercisePreview({
  title,
  instructions,
  passageContent,
  showPassage,
  sections,
  onBack,
}: ExercisePreviewProps) {
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Editor
        </Button>
        <h2 className="text-xl font-bold">Preview Mode</h2>
      </div>
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {instructions && (
          <p className="text-muted-foreground italic">{instructions}</p>
        )}
        {showPassage && passageContent && (
          <div className="rounded-md border p-6 space-y-3">
            {passageContent
              .split(/\n\n+/)
              .filter((p) => p.trim())
              .map((para, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="font-bold text-primary min-w-[1.5rem] text-right">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <p className="leading-relaxed">{para.trim()}</p>
                </div>
              ))}
          </div>
        )}
        {(sections ?? []).map((section, sIdx) => (
          <div key={section.id} className="space-y-3">
            <h3 className="font-semibold">
              Section {sIdx + 1}: {section.sectionType.replace(/_/g, " ")}
            </h3>
            {section.instructions && (
              <p className="text-sm text-muted-foreground italic">
                {section.instructions}
              </p>
            )}
            {(section.questions ?? []).map((q, qIdx) => (
              <div key={q.id} className="flex gap-3 pl-4">
                <span className="text-sm font-medium min-w-[2rem]">
                  {qIdx + 1}.
                </span>
                <span className="text-sm">{q.questionText}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExerciseEditor() {
  const { user } = useAuth();
  const centerId = user?.centerId || undefined;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // State
  const [selectedSkill, setSelectedSkill] = useState<ExerciseSkill | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [passageContent, setPassageContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userHasEdited = useRef(false);

  // Hooks
  const { createExercise, publishExercise } = useExercises(centerId);
  const { exercise, isLoading, autosave, isAutosaving } = useExercise(
    centerId,
    id,
  );
  const {
    createSection,
    updateSection,
    deleteSection,
    createQuestion,
    deleteQuestion,
  } = useSections(id);

  // Load existing exercise data
  useEffect(() => {
    if (exercise) {
      setTitle(exercise.title);
      setInstructions(exercise.instructions ?? "");
      setPassageContent(exercise.passageContent ?? "");
      setSelectedSkill(exercise.skill);
      // Reset edit tracking — data was just loaded, not user-edited
      userHasEdited.current = false;
    }
  }, [exercise]);

  // Mark as user-edited when form fields change (not on initial load)
  const handleFieldChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
      setter(value);
      userHasEdited.current = true;
    },
    [],
  );

  // Auto-save effect (30 second debounce)
  const scheduleAutosave = useCallback(() => {
    if (!id || !userHasEdited.current) return;
    setSaveStatus("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await autosave({
          title: title || undefined,
          instructions: instructions || null,
          passageContent: passageContent || null,
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 30000);
  }, [id, title, instructions, passageContent, autosave]);

  useEffect(() => {
    if (isEditing && exercise && userHasEdited.current) {
      scheduleAutosave();
    }
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, instructions, passageContent, isEditing, exercise, scheduleAutosave]);

  // Handlers
  const handleSkillSelect = async (skill: ExerciseSkill) => {
    setSelectedSkill(skill);
    try {
      const created = await createExercise({
        title: "Untitled Exercise",
        skill,
      });
      navigate(`../exercises/${created.id}/edit`, { replace: true });
      toast.success("Exercise created");
    } catch {
      toast.error("Failed to create exercise");
      setSelectedSkill(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!id) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    try {
      setSaveStatus("saving");
      await autosave({
        title: title || undefined,
        instructions: instructions || null,
        passageContent: passageContent || null,
      });
      setSaveStatus("saved");
      toast.success("Draft saved");
    } catch {
      setSaveStatus("unsaved");
      toast.error("Failed to save");
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await handleSaveDraft();
      await publishExercise(id);
      toast.success("Exercise published");
      navigate("../exercises", { replace: true });
    } catch {
      toast.error("Failed to publish exercise");
    } finally {
      setShowPublishDialog(false);
    }
  };

  const handleAddSection = async () => {
    if (!id || !selectedSkill) return;
    try {
      await createSection({
        sectionType: DEFAULT_SECTION_TYPE[selectedSkill],
        orderIndex: exercise?.sections?.length ?? 0,
      });
    } catch {
      toast.error("Failed to add section");
    }
  };

  const handleUpdateSection = async (
    sectionId: string,
    data: { sectionType?: IeltsQuestionType; instructions?: string | null },
  ) => {
    try {
      await updateSection({ sectionId, input: data });
    } catch {
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSectionConfirm = async () => {
    if (!deleteSectionId) return;
    try {
      await deleteSection(deleteSectionId);
    } catch {
      toast.error("Failed to delete section");
    } finally {
      setDeleteSectionId(null);
    }
  };

  const handleCreateQuestion = async (
    sectionId: string,
    input: CreateQuestionInput,
  ) => {
    try {
      await createQuestion({ sectionId, input });
    } catch {
      toast.error("Failed to add question");
    }
  };

  const handleDeleteQuestion = async (
    sectionId: string,
    questionId: string,
  ) => {
    try {
      await deleteQuestion({ sectionId, questionId });
    } catch {
      toast.error("Failed to delete question");
    }
  };

  // New exercise: show skill selector
  if (!isEditing && !selectedSkill) {
    return (
      <div className="container py-10">
        <Button variant="ghost" onClick={() => navigate("../exercises")} className="mb-6">
          <ArrowLeft className="mr-2 size-4" />
          Back to Exercises
        </Button>
        <SkillSelector onSelect={handleSkillSelect} />
      </div>
    );
  }

  // Loading existing exercise
  if (isEditing && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const showPassage = selectedSkill === "READING" || selectedSkill === "LISTENING";

  if (showPreview) {
    return (
      <ExercisePreview
        title={title}
        instructions={instructions}
        passageContent={passageContent}
        showPassage={showPassage}
        sections={exercise?.sections}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="container py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("../exercises")}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Exercises
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {saveStatus === "saving" || isAutosaving
              ? "Saving..."
              : saveStatus === "unsaved"
                ? "Unsaved changes"
                : "Saved"}
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 size-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save className="mr-2 size-4" />
            Save Draft
          </Button>
          {exercise?.status === "DRAFT" && (
            <Button size="sm" onClick={() => setShowPublishDialog(true)}>
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Title & Instructions */}
      <div className="space-y-4 max-w-3xl">
        <div className="space-y-2">
          <Label htmlFor="exercise-title">Title</Label>
          <Input
            id="exercise-title"
            value={title}
            onChange={(e) => handleFieldChange(setTitle, e.target.value)}
            placeholder="Exercise title"
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exercise-instructions">Instructions</Label>
          <Textarea
            id="exercise-instructions"
            value={instructions}
            onChange={(e) => handleFieldChange(setInstructions, e.target.value)}
            placeholder="General instructions for the exercise..."
            className="min-h-[80px]"
          />
        </div>
      </div>

      {/* Passage Editor */}
      {showPassage && (
        <div className="max-w-3xl">
          <PassageEditor
            value={passageContent}
            onChange={(v) => handleFieldChange(setPassageContent, v)}
          />
        </div>
      )}

      {/* Question Sections */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Label>Question Sections</Label>
          <Button variant="outline" size="sm" onClick={handleAddSection}>
            <Plus className="mr-1 size-4" />
            Add Section
          </Button>
        </div>

        {(exercise?.sections ?? []).map((section, idx) => (
          <QuestionSectionEditor
            key={section.id}
            section={section}
            skill={selectedSkill!}
            index={idx}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={setDeleteSectionId}
            onCreateQuestion={handleCreateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        ))}

        {(exercise?.sections?.length ?? 0) === 0 && (
          <div className="text-center py-8 text-muted-foreground rounded-md border border-dashed">
            No question sections yet. Click &ldquo;Add Section&rdquo; to start
            building questions.
          </div>
        )}
      </div>

      <AlertDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish this exercise? Students will be
              able to see it and editing will be limited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteSectionId}
        onOpenChange={(open) => !open && setDeleteSectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this section and all its questions? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSectionConfirm}
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
