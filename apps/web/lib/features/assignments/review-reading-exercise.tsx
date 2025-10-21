"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import { Gap } from "@/lib/core/components/editor/extensions/gap";
import { TableKit } from "@tiptap/extension-table";
import {
  JSONContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { renderToReactElement } from "@tiptap/static-renderer";
import {
  ReadingCompletionTask,
  ReadingExercise,
  ReadingExerciseTask,
  ReadingMultipleChoiceQuestion,
  ReadingMultipleChoiceQuestionOption,
  ReadingSubmissionContent,
  ReadingSubmissionGrade,
  Submission,
} from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useUpdateSubmission from "../submission/hooks/use-update-submission";

// New component for Completion task review
function CompletionReview({
  task,
  studentAnswersMap,
  questionMap,
  markedCorrect,
  getQuestionNumber,
}: {
  task: ReadingCompletionTask;
  studentAnswersMap: Map<string, string | null>;
  questionMap: Map<string, { task: ReadingExerciseTask; question: any }>;
  markedCorrect: Record<string, boolean>;
  getQuestionNumber: (taskId: number, questionId: number) => number;
}) {
  const contentEditor = useEditor(
    {
      extensions: [
        StarterKit,
        TableKit,
        Gap.extend({
          addNodeView() {
            return ReactNodeViewRenderer(({ node }) => {
              const questionId = `task-${task.order}-question-${node.attrs.order}`;
              const studentAnswer = studentAnswersMap.get(questionId);
              const isCorrect = markedCorrect[questionId];
              const questionData = questionMap.get(questionId);
              const correctAnswer = questionData?.question.correctAnswer;
              const questionNumber = getQuestionNumber(
                task.order,
                node.attrs.order,
              );

              return (
                <NodeViewWrapper
                  as="span"
                  className="inline-block align-bottom"
                >
                  <div className="border-2 border-dashed rounded-md p-2 min-w-[8rem] text-center">
                    <div className="font-semibold text-muted-foreground text-xs mb-1">
                      {questionNumber}
                    </div>
                    {isCorrect ? (
                      <div className="p-2 rounded-md bg-green-700 border-green-800 text-white flex items-center justify-between">
                        <span>{studentAnswer}</span>
                        <span className="font-bold text-sm">+1</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="p-2 rounded-md bg-red-700 border-red-800 text-white">
                          {studentAnswer ?? "Not answered"}
                        </div>
                        {correctAnswer && (
                          <div className="p-2 rounded-md bg-green-700 border-green-800 text-white">
                            {correctAnswer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </NodeViewWrapper>
              );
            });
          },
        }),
      ],
      content: task.content,
      editable: false,
      immediatelyRender: false,
    },
    [task, studentAnswersMap, questionMap, markedCorrect, getQuestionNumber],
  );

  return <AppEditor editor={contentEditor} showMenu={false} />;
}

interface ReviewReadingExerciseProps {
  exercise: ReadingExercise;
  submission: Submission;
}

function ReviewReadingExercise({
  exercise,
  submission,
}: ReviewReadingExerciseProps) {
  const submissionContent = submission.content as ReadingSubmissionContent;

  const studentAnswersMap = useMemo(() => {
    const map = new Map<string, string | null>();
    if (submissionContent && submissionContent.tasks) {
      submissionContent.tasks.forEach((task) => {
        task.questions.forEach((q) => {
          map.set(`task-${task.order}-question-${q.order}`, q.answer);
        });
      });
    }
    return map;
  }, [submissionContent]);

  const { questionMap } = useMemo(() => {
    const questions: { task: ReadingExerciseTask; question: any }[] = [];
    const questionMap = new Map<
      string,
      { task: ReadingExerciseTask; question: any }
    >();
    exercise.tasks?.forEach((task) => {
      task.questions?.forEach((question) => {
        const questionId = `task-${task.order}-question-${question.order}`;
        const item = { task, question };
        questions.push(item);
        questionMap.set(questionId, item);
      });
    });
    return { questions, questionMap };
  }, [exercise]);

  const [markedCorrect, setMarkedCorrect] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const initialMarkedCorrect: Record<string, boolean> = {};
    for (const [questionId, { question }] of questionMap.entries()) {
      const studentAnswer = studentAnswersMap.get(questionId);
      const correctAnswer = (question as any).correctAnswer;
      initialMarkedCorrect[questionId] =
        JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer);
    }
    setMarkedCorrect(initialMarkedCorrect);
  }, [questionMap, studentAnswersMap]);

  const feedbackEditor = useEditor({
    extensions: [StarterKit],
    content: (submission.feedback as any)?.feedback || "",
    immediatelyRender: false,
  });
  const passageEditor = useEditor({
    extensions: [StarterKit],
    content: exercise.content,
    editable: false,
    immediatelyRender: false,
  });

  const { score, total } = submission.grade as ReadingSubmissionGrade;

  const getQuestionNumber = (taskId: number, questionId: number) => {
    let questionNumber = 0;
    for (const task of exercise.tasks) {
      if (task.order < taskId) {
        questionNumber += task.questions.length;
      } else if (task.order === taskId) {
        questionNumber += questionId;
        break;
      }
    }
    return questionNumber;
  };

  const { mutate: updateSubmission, isPending: isPendingUpdateSubmission } =
    useUpdateSubmission();

  const handleSaveFeedback = () => {
    updateSubmission({
      id: submission.id,
      feedback: feedbackEditor?.getJSON(),
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[calc(100vh-var(--header-height)-2rem)] p-4">
      {/* Left Column: Questions */}
      <div className="col-span-1 overflow-y-auto rounded-md border">
        <div className="p-6">
          {exercise.tasks?.map((task) => (
            <div key={task.order} className="mb-8">
              <h3 className="font-bold text-lg mb-2">Task {task.order}</h3>
              {task.instructions &&
                renderToReactElement({
                  content: task.instructions as JSONContent,
                  extensions: [StarterKit],
                })}

              {task.type === "Completion" ? (
                <CompletionReview
                  task={task as ReadingCompletionTask}
                  studentAnswersMap={studentAnswersMap}
                  questionMap={questionMap}
                  markedCorrect={markedCorrect}
                  getQuestionNumber={getQuestionNumber}
                />
              ) : (
                task.questions.map((question) => {
                  const questionId = `task-${task.order}-question-${question.order}`;
                  const studentAnswer = studentAnswersMap.get(questionId);
                  const correctAnswer = (question as any).correctAnswer;
                  const isCorrect = markedCorrect[questionId];
                  const questionNumber = getQuestionNumber(
                    task.order,
                    question.order,
                  );

                  return (
                    <div
                      key={questionId}
                      className="mb-4 p-4 rounded-md border"
                    >
                      <p className="font-semibold mb-2">
                        {questionNumber}: {(question as any).content}
                      </p>

                      {/* Multiple Choice Renderer */}
                      {task.type === "Multiple choice" && (
                        <>
                          <div className="space-y-2 mb-2">
                            {(
                              question as ReadingMultipleChoiceQuestion
                            ).options.map(
                              (opt: ReadingMultipleChoiceQuestionOption) => (
                                <div
                                  key={opt.value}
                                  className="p-2 rounded-md border"
                                >
                                  {opt.content}
                                </div>
                              ),
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 rounded-md border bg-green-700 border-green-800 text-white flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-sm">
                                  Correct Answer:{" "}
                                </span>
                                {
                                  (
                                    question as ReadingMultipleChoiceQuestion
                                  ).options.find(
                                    (o) => o.value === correctAnswer,
                                  )?.content
                                }
                              </div>
                              {isCorrect && (
                                <span className="font-bold text-sm">+1</span>
                              )}
                            </div>
                            {!isCorrect && (
                              <div className="p-2 rounded-md border bg-red-700 border-red-800 text-white">
                                <span className="font-semibold text-sm">
                                  Your Answer:{" "}
                                </span>
                                {(
                                  question as ReadingMultipleChoiceQuestion
                                ).options.find((o) => o.value === studentAnswer)
                                  ?.content ?? "Not answered"}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* T/F/NG and Y/N/NG Renderer */}
                      {(task.type === "True/False/Not Given" ||
                        task.type === "Yes/No/Not Given") && (
                        <div className="space-y-2">
                          <div
                            className={cn(
                              "p-2 rounded-md border text-white flex items-center justify-between",
                              {
                                "bg-green-700 border-green-800": isCorrect,
                                "bg-red-700 border-red-800": !isCorrect,
                              },
                            )}
                          >
                            <div>
                              <span className="font-semibold text-sm">
                                Student's Answer:{" "}
                              </span>
                              {studentAnswer ?? "Not answered"}
                            </div>
                            {isCorrect && (
                              <span className="font-bold text-sm">+1</span>
                            )}
                          </div>
                          {!isCorrect && (
                            <div className="p-2 rounded-md border bg-green-700 border-green-800 text-white">
                              <span className="font-semibold text-sm">
                                Correct Answer:{" "}
                              </span>
                              {correctAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Other types renderer */}
                      {task.type !== "Multiple choice" &&
                        task.type !== "True/False/Not Given" &&
                        task.type !== "Yes/No/Not Given" && (
                          <div className="space-y-2">
                            <div
                              className={cn(
                                "p-2 rounded-md border text-white flex items-center justify-between",
                                {
                                  "bg-green-700 border-green-800": isCorrect,
                                  "bg-red-700 border-red-800": !isCorrect,
                                },
                              )}
                            >
                              <div>
                                <span className="font-semibold text-sm">
                                  Student's Answer:{" "}
                                </span>
                                {JSON.stringify(
                                  studentAnswer ?? "Not answered",
                                )}
                              </div>
                              {isCorrect && (
                                <span className="font-bold text-sm">+1</span>
                              )}
                            </div>
                            {!isCorrect && (
                              <div className="p-2 rounded-md border bg-green-700 border-green-800 text-white">
                                <span className="font-semibold text-sm">
                                  Correct Answer:{" "}
                                </span>
                                {JSON.stringify(correctAnswer)}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Tabs */}
      <div className="col-span-1">
        <Tabs defaultValue="material" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="material">Reading Material</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          <TabsContent value="material" className="flex-grow overflow-y-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{exercise.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <AppEditor editor={passageEditor} showMenu={false} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="result" className="flex-grow">
            <Card>
              <CardHeader>
                <CardTitle>Score & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-bold text-lg">
                  Score: {score} / {total}
                </p>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Feedback</h4>
                  <Button
                    onClick={handleSaveFeedback}
                    disabled={isPendingUpdateSubmission}
                  >
                    {isPendingUpdateSubmission ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
                <div className="rounded-md border">
                  <AppEditor editor={feedbackEditor} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export { ReviewReadingExercise };
