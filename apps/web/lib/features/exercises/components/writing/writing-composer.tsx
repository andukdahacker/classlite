"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { WritingExercise, WritingExerciseType } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Textarea } from "@workspace/ui/components/textarea";
import { CheckIcon, Eye, Loader2Icon, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import useDeleteWritingFile from "../../hooks/use-delete-writing-file";
import useUpdateExercise from "../../hooks/use-update-exercise";
import useUploadWritingFile from "../../hooks/use-upload-writing-file";
import { WritingComposerContext } from "./writing-composer-context";

function WritingComposer() {
  const {
    name,
    setName,
    description,
    setDescription,
    content,
    setContent,
    exercise,
    type,
    setType,
    writingFile,
    setWritingFile,
    title,
    setTitle,
    duration,
    setDuration,
  } = useContext(WritingComposerContext);

  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
    immediatelyRender: false,
  });

  const { mutate: updateExercise, isPending } = useUpdateExercise();

  const { mutate: uploadFile } = useUploadWritingFile({
    onSuccess: (data) => {
      const content = data.content as WritingExercise;
      setWritingFile(content.file ?? null);
    },
  });

  const { mutate: deleteFile } = useDeleteWritingFile({
    onSuccess: () => {
      setWritingFile(null);
    },
  });

  return (
    <div className="flex flex-col gap-4 justify-center items-center p-4 pb-20 md:pb-4">
      <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl">
        <Input value={name} onChange={(event) => setName(event.target.value)} />

        <Textarea
          placeholder="Describe this exercise..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>

      <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl">
        <div className="flex flex-col gap-2">
          <Label>Task Type</Label>
          <RadioGroup
            defaultValue={type}
            onValueChange={(value) => setType(value as WritingExerciseType)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Task 1" id="task1" />
              <Label htmlFor="task1">Task 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Task 2" id="task2" />
              <Label htmlFor="task2">Task 2</Label>
            </div>
          </RadioGroup>
        </div>

        {type === "Task 1" && (
          <div className="rounded-md border p-4 flex flex-col gap-4 w-full max-w-2xl">
            <div className="flex justify-between flex-row">
              <span className="font-bold">Writing Image</span>
            </div>
            {writingFile ? (
              <div className="flex items-center gap-2">
                <img
                  src={writingFile.url}
                  alt="Writing Task 1"
                  className="w-full h-auto object-contain"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() =>
                    deleteFile({
                      id: exercise!.id,
                      key: writingFile.key,
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, WEBP, SVG, BMP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadFile({
                          id: exercise!.id,
                          file,
                          fileName: file.name,
                        });
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        <Input
          placeholder="Duration in minutes (optional)"
          type="number"
          value={duration ?? ""}
          onChange={(event) =>
            setDuration(event.target.value ? Number(event.target.value) : null)
          }
        />

        <div className="flex justify-between flex-row">
          <span className="font-bold">Writing Prompt</span>
        </div>
        <AppEditor editor={editor} />
      </div>

      <div className="fixed bottom-4 md:top-1/2 md:right-4 md:bottom-auto flex md:flex-col justify-center w-full md:w-auto">
        <div className="flex md:flex-col gap-2 rounded-full border bg-background p-2 shadow-lg">
          <Button
            size="icon"
            onClick={() => {
              updateExercise(
                {
                  id: exercise!.id,
                  content: {
                    type,
                    file: writingFile,
                    title,
                    duration,
                    content,
                  },
                  name,
                },
                {
                  onSuccess: () => {
                    router.push(`/dashboard/exercises/${exercise?.id}/preview`);
                  },
                },
              );
            }}
            disabled={isPending}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() =>
              updateExercise({
                id: exercise!.id,
                content: {
                  type,
                  file: writingFile,
                  title,
                  duration,
                  content,
                },
                name,
              })
            }
            disabled={isPending}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { WritingComposer };
