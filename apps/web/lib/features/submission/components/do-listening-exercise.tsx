"use client";

import {
  Assignment,
  Exercise,
  ListeningExercise,
  ListeningExerciseTask,
  ListeningSubmissionContent,
  Submission,
} from "@workspace/types";
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useCreateSubmission from "../hooks/use-create-submission";
import { CompletionTaskSubmission } from "./reading/completion-task-submission";

interface DoListeningExerciseProps {
  exercise: Exercise;
  assignment: Assignment;
  submission: Submission | null;
}

function DoListeningExercise({
  exercise,
  assignment,
  submission,
}: DoListeningExerciseProps) {
  const listeningExercise = exercise.content as ListeningExercise;
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<ListeningSubmissionContent>({
    tasks: [],
  });
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<
    number | null
  >(null);

  const getQuestionNumber = (
    tasks: ListeningExerciseTask[],
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

  const allQuestions = useMemo(() => {
    const questions: {
      taskIndex: number;
      questionIndex: number;
      questionNumber: number;
      order: number;
    }[] = [];
    let questionCounter = 1;
    listeningExercise.tasks.forEach((task, taskIndex) => {
      task.questions?.forEach((question, questionIndex) => {
        questions.push({
          taskIndex,
          questionIndex,
          questionNumber: questionCounter,
          order: question.order,
        });
        questionCounter++;
      });
    });
    return questions;
  }, [listeningExercise.tasks]);

  useEffect(() => {
    if (submission?.content) {
      setAnswers(submission.content as ListeningSubmissionContent);
    } else {
      const initialTasks = listeningExercise.tasks.map((task) => ({
        order: task.order,
        questions: task.questions.map((question) => ({
          order: question.order,
          answer: null,
        })),
      }));
      setAnswers({ tasks: initialTasks });
    }
    if (allQuestions.length > 0) {
      setSelectedQuestionNumber(allQuestions[0]!.questionNumber);
    }
  }, [submission, listeningExercise.tasks, allQuestions]);

  const scrollToQuestion = (questionNumber: number) => {
    setSelectedQuestionNumber(questionNumber);
    const element = document.getElementById(`question-${questionNumber}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const { mutate: createSubmission, isPending } = useCreateSubmission({
    onSuccess: () => {
      toast.success("Submission successful!");
      router.push("/dashboard/assignments");
    },
  });

  const handlePlay = () => {
    setHasStarted(true);
    if (audioRef.current) {
      console.log("play", audioRef.current);
      audioRef.current.play();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submission) return;
    createSubmission({
      assignmentId: assignment.id,
      content: answers,
    });
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
      const questionNumber = getQuestionNumber(
        listeningExercise.tasks,
        taskIndex,
        questionIndex,
      );
      setSelectedQuestionNumber(questionNumber);
      return { tasks: newTasks };
    });
  };

  return (
    <div className="h-[calc(100vh-130px)]">
      {listeningExercise.file && (
        <audio
          ref={audioRef}
          src={listeningExercise.file.url}
          controlsList="nodownload nofullscreen noremoteplayback"
          onLoadedMetadata={() => {
            if (audioRef.current) {
              audioRef.current.controls = false; // Disable controls after metadata is loaded
            }
          }}
          onSeeking={(e) => e.preventDefault()}
          onSeeked={(e) => e.preventDefault()}
          className="w-full"
        />
      )}
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <ScrollArea className="h-full p-4">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold text-center">{exercise.name}</h3>
            {!hasStarted ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-center text-lg">
                  You will be listening to an audio clip during this test. You
                  will not be permitted to pause or rewind the audio while
                  answering the questions.
                </p>
                <Button onClick={handlePlay}>To continue, click Play</Button>
              </div>
            ) : (
              <>
                <div className="p-4 flex flex-col gap-4">
                  {listeningExercise.tasks.map((task, taskIndex) => (
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
                                    listeningExercise.tasks,
                                    taskIndex,
                                    questionIndex,
                                  );
                                  const answer =
                                    answers.tasks[taskIndex]?.questions[
                                      questionIndex
                                    ]?.answer;
                                  return (
                                    <div
                                      id={`question-${questionNumber}`}
                                      key={question.order}
                                    >
                                      <div className="space-y-3">
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
                                    listeningExercise.tasks,
                                    taskIndex,
                                    questionIndex,
                                  );
                                  const answer =
                                    answers.tasks[taskIndex]?.questions[
                                      questionIndex
                                    ]?.answer;
                                  return (
                                    <div
                                      id={`question-${questionNumber}`}
                                      key={question.order}
                                    >
                                      <div className="space-y-3">
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
                                          {options.map(
                                            (option, optionIndex) => (
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
                                            ),
                                          )}
                                        </RadioGroup>
                                      </div>
                                    </div>
                                  );
                                },
                              );
                            case "Completion":
                              return (
                                <CompletionTaskSubmission
                                  task={task}
                                  answers={answers}
                                  onAnswerChange={handleAnswerChange}
                                  taskIndex={taskIndex}
                                  isSubmitted={!!submission}
                                  allQuestions={allQuestions}
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
              </>
            )}
          </div>
        </ScrollArea>
        <div className="h-[65px] flex flex-row justify-between items-center px-4 border-t">
          <div className="flex gap-2 flex-wrap">
            {allQuestions.map(
              ({ taskIndex, questionIndex, questionNumber }) => {
                const isAnswered =
                  !!answers.tasks[taskIndex]?.questions[questionIndex]?.answer;
                return (
                  <Button
                    key={questionNumber}
                    variant={
                      questionNumber === selectedQuestionNumber
                        ? "default"
                        : isAnswered
                          ? "secondary"
                          : "outline"
                    }
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollToQuestion(questionNumber)}
                  >
                    {questionNumber}
                  </Button>
                );
              },
            )}
          </div>
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

export { DoListeningExercise };
