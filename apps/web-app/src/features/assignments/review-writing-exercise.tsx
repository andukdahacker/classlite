"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Comment } from "@/lib/core/components/editor/comment/comment";
import "@/lib/core/components/editor/comment/comment.css";
import { CommentClickPlugin } from "@/lib/core/components/editor/comment/comment_click.plugin";
import { CommentHighlightPlugin } from "@/lib/core/components/editor/comment/comment_highlight.plugin";
import { OverlappingCommentHighlightPlugin } from "@/lib/core/components/editor/comment/overlapping_comment_highlight.plugin";
import { useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
    Exercise,
    Submission,
    WritingComment,
    WritingExercise,
    WritingSubmissionContent,
    WritingSubmissionFeedback,
    WritingSubmissionGrade,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import useUpdateSubmission from "../submission/hooks/use-update-submission";
import WritingCommentView from "./components/writing-comment";

interface ReviewWritingExerciseProps {
  exercise: Exercise;
  submission: Submission;
}

let selectedCommentRef: React.RefObject<string | null> = {
  current: null,
};

function ReviewWritingExercise({
  exercise,
  submission,
}: ReviewWritingExerciseProps) {
  const writingExercise = exercise.content as WritingExercise;
  const submissionContent = submission.content as WritingSubmissionContent;
  const submissionFeedback =
    submission.feedback as WritingSubmissionFeedback | null;
  const submissionGrade = submission.grade as WritingSubmissionGrade | null;

  const [comments, setComments] = useState<WritingComment[]>(
    submissionFeedback?.comments ?? [],
  );
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("material");

  const [grade, setGrade] = useState<WritingSubmissionGrade>(
    submissionGrade ?? {
      taskAchievement: 0,
      taskAchievementComment: "",
      coherenceAndCohesion: 0,
      coherenceAndCohesionComment: "",
      lexicalResource: 0,
      lexicalResourceComment: "",
      grammaticalRangeAndAccuracy: 0,
      grammaticalRangeAndAccuracyComment: "",
      overallScore: 0,
    },
  );

  const { mutate: updateSubmission, isPending } = useUpdateSubmission();

  const studentEditor = useEditor({
    extensions: [StarterKit, Comment],
    content: submissionContent.value,
    immediatelyRender: false,
    editable: false,
    onCreate: ({ editor }) => {
      editor.registerPlugin(
        CommentClickPlugin((id) => {
          setSelectedComment(id);
          selectedCommentRef.current = id;
        }),
      );
      editor.registerPlugin(
        CommentHighlightPlugin(() => selectedCommentRef.current),
      );
      editor.registerPlugin(OverlappingCommentHighlightPlugin());
    },
  });

  const materialEditor = useEditor({
    extensions: [StarterKit],
    content: writingExercise.title,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!selectedComment) return;
    const commentEl = document.querySelector(
      `span[data-comment-id="${selectedComment}"]`,
    );
    const comment = document.querySelector(`div[id="${selectedComment}"`);
    if (commentEl) {
      commentEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (comment) {
      comment.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedComment]);

  useEffect(() => {
    if (
      grade.taskAchievement > 0 &&
      grade.coherenceAndCohesion > 0 &&
      grade.lexicalResource > 0 &&
      grade.grammaticalRangeAndAccuracy > 0
    ) {
      const overall =
        (grade.taskAchievement +
          grade.coherenceAndCohesion +
          grade.lexicalResource +
          grade.grammaticalRangeAndAccuracy) /
        4;
      setGrade((prev) => ({ ...prev, overallScore: overall }));
    } else {
      setGrade((prev) => ({ ...prev, overallScore: 0 }));
    }
  }, [
    grade.taskAchievement,
    grade.coherenceAndCohesion,
    grade.lexicalResource,
    grade.grammaticalRangeAndAccuracy,
  ]);

  const handleSave = () => {
    const payload = {
      id: submission.id,
      feedback: { comments },
      grade: grade,
      content: {
        value: studentEditor?.getJSON(),
      },
    };
    updateSubmission(payload, {
      onSuccess: () => toast.success("Feedback saved"),
      onError: () => toast.error("Failed to save feedback"),
    });
  };

  const handleGradeChange = (
    field: keyof WritingSubmissionGrade,
    value: string | number,
  ) => {
    setGrade((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrepareComment = () => {
    if (!studentEditor) return;
    const { from, to } = studentEditor.state.selection;
    if (from === to) return;

    const id = uuidv4();

    studentEditor.commands.addComment(id);

    const selectedText = studentEditor.state.doc.textBetween(from, to);
    const newComment: WritingComment = {
      id,
      selectedText,
      from,
      to,
      comment: "", // Empty comment for now, indicates a draft
      author: "Teacher", // Replace with actual author name
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) =>
      [...prev, newComment].sort((a, b) => a.from - b.from),
    );
    setActiveTab("comments");
    setSelectedComment(newComment.id);
    setDraftComment(newComment.id);
    selectedCommentRef.current = newComment.id;
  };

  const handleCancelDraft = (id: string) => {
    studentEditor?.commands.removeComment(id);

    const currentComments = [...comments];

    const filtered = currentComments.filter((e) => e.id != id);

    setComments(filtered);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* Left Column: Student's Submission */}
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Student's Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {studentEditor && (
              <BubbleMenu
                editor={studentEditor}
                shouldShow={({ editor }) => {
                  return !editor.state.selection.empty;
                }}
              >
                <Button onClick={handlePrepareComment}>Add Comment</Button>
              </BubbleMenu>
            )}
            <AppEditor editor={studentEditor} showMenu={false} />
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Tabs */}
      <div className="col-span-1">
        <Tabs
          defaultValue="material"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="material">Material</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="score">Score</TabsTrigger>
          </TabsList>

          <TabsContent value="material">
            <Card>
              <CardHeader>
                <CardTitle>Writing Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                {writingExercise.file && (
                  <img
                    src={writingExercise.file.url}
                    alt="Task 1 Image"
                    className="max-w-full"
                  />
                )}
                <AppEditor editor={materialEditor} showMenu={false} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.map((comment) => (
                  <WritingCommentView
                    key={comment.id}
                    submission={submission}
                    comment={comment}
                    isSelected={selectedComment === comment.id}
                    onCommentClick={() => {
                      setSelectedComment(comment.id);
                      selectedCommentRef.current = comment.id;

                      if (studentEditor) {
                        studentEditor.view.dispatch(
                          studentEditor.view.state.tr,
                        );
                      }
                    }}
                    onCommentSuccess={(updatedComments) => {
                      setComments(updatedComments);
                      setSelectedComment(null);
                      setDraftComment(null);
                    }}
                    onCancelEditing={() => {
                      setSelectedComment(null);
                      selectedCommentRef.current = null;

                      if (studentEditor) {
                        studentEditor.view.dispatch(
                          studentEditor.view.state.tr,
                        );
                      }
                    }}
                    onCancel={() => {
                      handleCancelDraft(comment.id);
                    }}
                    isDraft={draftComment === comment.id}
                    editor={studentEditor}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="score">
            <Card>
              <CardHeader>
                <CardTitle>Scoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ta-score">Task Achievement</Label>
                  <Input
                    id="ta-score"
                    type="number"
                    value={grade.taskAchievement}
                    onChange={(e) =>
                      handleGradeChange("taskAchievement", +e.target.value)
                    }
                  />
                  <Textarea
                    placeholder="Comment..."
                    value={grade.taskAchievementComment}
                    onChange={(e) =>
                      handleGradeChange(
                        "taskAchievementComment",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-score">Coherence and Cohesion</Label>
                  <Input
                    id="cc-score"
                    type="number"
                    value={grade.coherenceAndCohesion}
                    onChange={(e) =>
                      handleGradeChange("coherenceAndCohesion", +e.target.value)
                    }
                  />
                  <Textarea
                    placeholder="Comment..."
                    value={grade.coherenceAndCohesionComment}
                    onChange={(e) =>
                      handleGradeChange(
                        "coherenceAndCohesionComment",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lr-score">Lexical Resource</Label>
                  <Input
                    id="lr-score"
                    type="number"
                    value={grade.lexicalResource}
                    onChange={(e) =>
                      handleGradeChange("lexicalResource", +e.target.value)
                    }
                  />
                  <Textarea
                    placeholder="Comment..."
                    value={grade.lexicalResourceComment}
                    onChange={(e) =>
                      handleGradeChange(
                        "lexicalResourceComment",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gra-score">
                    Grammatical Range and Accuracy
                  </Label>
                  <Input
                    id="gra-score"
                    type="number"
                    value={grade.grammaticalRangeAndAccuracy}
                    onChange={(e) =>
                      handleGradeChange(
                        "grammaticalRangeAndAccuracy",
                        +e.target.value,
                      )
                    }
                  />
                  <Textarea
                    placeholder="Comment..."
                    value={grade.grammaticalRangeAndAccuracyComment}
                    onChange={(e) =>
                      handleGradeChange(
                        "grammaticalRangeAndAccuracyComment",
                        e.target.value,
                      )
                    }
                  />
                </div>
                {grade.overallScore > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="overall-score">Overall Score</Label>
                    <p className="text-lg font-semibold">
                      {grade.overallScore.toFixed(2)}
                    </p>
                  </div>
                )}
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending ? "Saving..." : "Save Feedback"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ReviewWritingExercise;
