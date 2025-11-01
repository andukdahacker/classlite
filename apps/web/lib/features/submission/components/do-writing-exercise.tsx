"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Content, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Assignment,
  Exercise,
  Submission,
  WritingExercise,
  WritingSubmissionContent,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Textarea } from "@workspace/ui/components/textarea";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";
import useCreateSubmission from "../hooks/use-create-submission";

interface DoWritingExerciseProps {
  exercise: Exercise;
  assignment: Assignment;
  submission: Submission | null;
}

function DoWritingExercise({
  exercise,
  assignment,
  submission,
}: DoWritingExerciseProps) {
  const writingExercise = exercise.content as WritingExercise;
  const router = useRouter();

  const [answer, setAnswer] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);

  useEffect(() => {
    if (submission?.content) {
      setAnswer((submission.content as WritingSubmissionContent).value || "");
    }
  }, [submission]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAnswer(text);
    setWordCount(text.split(/\s+/).filter(Boolean).length);
  };

  const { mutate: createSubmission, isPending } = useCreateSubmission({
    onSuccess: (data) => {
      toast.success("Submission successful!");
      router.push("/dashboard/assignments/" + data.assignmentId);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submission) return;
    createSubmission({
      assignmentId: assignment.id,
      content: { value: answer },
    });
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: writingExercise.title as Content,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="h-[calc(100vh-130px)]">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <PanelGroup direction="horizontal" className="flex-grow">
          <Panel defaultSize={50}>
            <ScrollArea className="h-full p-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-bold text-center">
                  {exercise.name}
                </h3>
                {writingExercise.file && (
                  <img
                    src={writingExercise.file.url}
                    alt={writingExercise.file.fileName}
                    className="max-w-full h-auto mx-auto"
                  />
                )}

                <AppEditor editor={editor} showMenu={false} />
              </div>
            </ScrollArea>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
          <Panel defaultSize={50}>
            <ScrollArea className="h-full p-4">
              <div className="flex flex-col gap-4 h-full">
                <Label htmlFor="writing-answer">Your Answer</Label>
                <Textarea
                  id="writing-answer"
                  placeholder="Write your answer here..."
                  className="flex-grow resize-none"
                  value={answer}
                  onChange={handleAnswerChange}
                  disabled={!!submission}
                  rows={30}
                />
                <div className="text-sm text-gray-500">
                  Word count: {wordCount}
                </div>
              </div>
            </ScrollArea>
          </Panel>
        </PanelGroup>
        <div className="h-[65px] flex flex-row justify-end items-center px-4 border-t">
          {!submission && (
            <Button type="submit" size="icon" disabled={isPending}>
              <CheckIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export { DoWritingExercise };
