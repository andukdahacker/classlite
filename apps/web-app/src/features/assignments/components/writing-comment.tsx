"use client";

import { Editor } from "@tiptap/react";
import {
  Submission,
  WritingComment,
  WritingSubmissionFeedback,
} from "@workspace/types";
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
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useUpdateSubmission from "../../submission/hooks/use-update-submission";

interface WritingCommentViewProps {
  submission: Submission;
  comment: WritingComment;
  isSelected: boolean;
  onCommentClick: () => void;
  onCommentSuccess: (comments: WritingComment[]) => void;
  onCancelEditing: () => void;
  onCancel: () => void;
  isDraft: boolean;
  editor: Editor | null;
  isReviewing?: boolean;
}

function WritingCommentView({
  comment,
  submission,
  isSelected,
  onCommentClick,
  onCancel,
  onCancelEditing,
  onCommentSuccess,
  isDraft,
  editor,
  isReviewing = false,
}: WritingCommentViewProps) {
  const [value, setValue] = useState(comment.comment);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutateAsync, isPending } = useUpdateSubmission();

  const feedback = submission.feedback as WritingSubmissionFeedback | null;
  const feedbackComments = feedback?.comments ?? [];

  const addComment = async () => {
    const newComments = [...feedbackComments, { ...comment, comment: value }];
    const sorted = newComments.sort((a, b) => a.from - b.from);
    await mutateAsync({
      id: submission.id,
      feedback: {
        comments: sorted,
      },
      content: {
        value: editor?.getJSON(),
      },
    });
    onCommentSuccess(sorted);
    onCancelEditing();
  };

  const editComment = async () => {
    const index = feedbackComments.findIndex((e) => e.id == comment.id);
    if (index < 0) return;

    const newComments = [...feedbackComments];
    newComments[index] = {
      ...comment,
      comment: value,
      updatedAt: new Date().toISOString(),
    };

    await mutateAsync({
      id: submission.id,
      feedback: {
        comments: newComments,
      },
    });
    onCommentSuccess(newComments);
    onCancelEditing();
    setIsEditing(false);
  };

  const deleteComment = async () => {
    const notificationId = toast.loading("Deleting comment");
    const newComments = feedbackComments.filter((e) => e.id != comment.id);

    if (editor) {
      editor.commands.removeComment(comment.id);
    }

    try {
      await mutateAsync({
        id: submission.id,
        feedback: {
          comments: newComments,
        },
        content: {
          value: editor?.getJSON(),
        },
      });
      onCommentSuccess(newComments);
      toast.success("Comment deleted", { id: notificationId });
    } catch (error) {
      toast.error("Failed to delete comment", { id: notificationId });
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      onCancelEditing();
      setIsEditing(false);
    } else {
      onCancel();
    }
  };

  return (
    <>
      <Card
        onClick={onCommentClick}
        className={cn("cursor-pointer", isSelected ? "border-blue-500" : "")}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-sm">{comment.author}</p>
              {!isDraft && isReviewing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-500"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              "{comment.selectedText}"
            </p>
            {(isDraft || isEditing) && (
              <Textarea
                placeholder="Your comment"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            )}
            {(isDraft || isEditing) && (
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  disabled={value.length === 0}
                  onClick={isDraft ? addComment : editComment}
                >
                  {isPending ? "Saving..." : "Comment"}
                </Button>
              </div>
            )}
            {!isDraft && !isEditing && (
              <p className="text-sm">{comment.comment}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteComment}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default WritingCommentView;
