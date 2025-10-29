"use client";

import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Assignment,
  Exercise,
  ReadingExercise,
  ReadingExerciseTask,
  ReadingSubmissionContent,
  Submission,
} from "@workspace/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import useCreateSubmission from "../hooks/use-create-submission";
import { CompletionTaskSubmission } from "./reading/completion-task-submission";

interface DoReadingExerciseProps {
  exercise: Exercise;
  assignment: Assignment;
  submission: Submission | null;
}

function DoReadingExercise({
  exercise,
  assignment,
  submission,
}: DoReadingExerciseProps) {
  const readingExercise = exercise.content as ReadingExercise;
  const tasks = readingExercise.tasks;
  const router = useRouter();

  const [answers, setAnswers] = useState<ReadingSubmissionContent>({
    tasks: [],
  });

  useEffect(() => {
    if (submission?.content) {
      setAnswers(submission.content as ReadingSubmissionContent);
    } else {
      const initialTasks = tasks.map((task) => ({
        order: task.order,
        questions: task.questions.map((question) => ({
          order: question.order,
          answer: null,
        })),
      }));
      setAnswers({ tasks: initialTasks });
    }
  }, [submission, tasks]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: readingExercise.content as Content,
    editable: false,
    immediatelyRender: false,
  });

  const { mutate: createSubmission, isPending } = useCreateSubmission({
    onSuccess: () => {
      toast.success("Submission successful!");
      router.push("/dashboard/assignments");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("values", answers);
    // if (submission) return;
    // createSubmission({
    //   assignmentId: assignment.id,
    //   content: answers,
    // });
  };

  const handleAnswerChange = (
    taskIndex: number,
    questionIndex: number,
    answer: string | null,
  ) => {
    setAnswers((prev) => {
      const newTasks = JSON.parse(JSON.stringify(prev.tasks)); // Deep copy
      const targetTask = newTasks[taskIndex];
      if (targetTask) {
        const targetQuestion = targetTask.questions[questionIndex];
        if (targetQuestion) {
          targetQuestion.answer = answer;
        }
      }
      return { tasks: newTasks };
    });
  };

  const getQuestionNumber = (
    tasks: ReadingExerciseTask[],
    taskIndex: number,
    questionIndex: number,
  ) => {
    let questionCount = 0;
    for (let i = 0; i < taskIndex; i++) {
      if (!tasks[i]) continue;
      questionCount += tasks[i]!.questions?.length || 0;
    }
    return questionCount + questionIndex + 1;
  };

  return (
    <div className="h-[calc(100vh-130px)]">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <PanelGroup direction="horizontal" className="flex-grow">
          <Panel>
            <ScrollArea className="h-full p-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-bold text-center">
                  {readingExercise.title}
                </h3>
                <EditorContent editor={editor} />
              </div>
            </ScrollArea>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
          <Panel>
            <ScrollArea className="h-full">
              <div className="p-4 flex flex-col gap-4">
                {tasks.map((task, taskIndex) => (
                  <Card key={task.order}>
                    <CardHeader>
                      <CardTitle>{task.type.replace(/_/g, " ")}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {(() => {
                        switch (task.type) {
                          case "Multiple choice":
                            return task.questions?.map(
                              (question, questionIndex) => {
                                const questionNumber = getQuestionNumber(
                                  tasks,
                                  taskIndex,
                                  questionIndex,
                                );
                                const answer =
                                  answers.tasks[taskIndex]?.questions[
                                    questionIndex
                                  ]?.answer;
                                return (
                                  <div
                                    key={question.order}
                                    className="space-y-3"
                                  >
                                    <Label>
                                      {questionNumber}. {question.content}
                                    </Label>
                                    <RadioGroup
                                      value={answer || undefined}
                                      onValueChange={(value) =>
                                        handleAnswerChange(
                                          taskIndex,
                                          questionIndex,
                                          value,
                                        )
                                      }
                                      className="flex flex-col space-y-1"
                                      disabled={!!submission}
                                    >
                                      {question.options.map(
                                        (option, optionIndex) => (
                                          <div
                                            key={optionIndex}
                                            className="flex items-center space-x-3 space-y-0"
                                          >
                                            <RadioGroupItem
                                              value={option.value}
                                            />
                                            <Label className="font-normal">
                                              {option.content}
                                            </Label>
                                          </div>
                                        ),
                                      )}
                                    </RadioGroup>
                                  </div>
                                );
                              },
                            );
                          case "True/False/Not Given":
                          case "Yes/No/Not Given":
                            const options =
                              task.type === "True/False/Not Given"
                                ? ["True", "False", "Not Given"]
                                : ["Yes", "No", "Not Given"];
                            return task.questions?.map(
                              (question, questionIndex) => {
                                const questionNumber = getQuestionNumber(
                                  tasks,
                                  taskIndex,
                                  questionIndex,
                                );
                                const answer =
                                  answers.tasks[taskIndex]?.questions[
                                    questionIndex
                                  ]?.answer;
                                return (
                                  <div
                                    key={question.order}
                                    className="space-y-3"
                                  >
                                    <Label>
                                      {questionNumber}. {question.content}
                                    </Label>
                                    <RadioGroup
                                      value={answer || undefined}
                                      onValueChange={(value) =>
                                        handleAnswerChange(
                                          taskIndex,
                                          questionIndex,
                                          value,
                                        )
                                      }
                                      className="flex gap-4"
                                      disabled={!!submission}
                                    >
                                      {options.map((option, optionIndex) => (
                                        <div
                                          key={optionIndex}
                                          className="flex items-center space-x-2"
                                        >
                                          <RadioGroupItem
                                            value={option}
                                            id={`${question.order}-${optionIndex}`}
                                          />
                                          <Label
                                            htmlFor={`${question.order}-${optionIndex}`}
                                            className="font-normal"
                                          >
                                            {option}
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </div>
                                );
                              },
                            );
                          case "Completion":
                            return (
                              <CompletionTaskSubmission
                                task={task}
                                answers={answers}
                                onAnswerChangeAction={handleAnswerChange}
                                taskIndex={taskIndex}
                                isSubmitted={!!submission}
                                questionBefore={
                                  getQuestionNumber(tasks, taskIndex, 0) - 1
                                }
                              />
                            );
                          default:
                            return <p>Unsupported task type: {task.type}</p>;
                        }
                      })()}
                    </CardContent>
                  </Card>
                ))}
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

export { DoReadingExercise };
