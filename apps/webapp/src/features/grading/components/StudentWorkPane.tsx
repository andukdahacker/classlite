import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Answer {
  id: string;
  questionId: string;
  answer: { text?: string; transcript?: string };
  score?: number;
}

interface Question {
  id: string;
  prompt?: string;
}

interface Section {
  type: string;
  instructions: string;
  questions: Question[];
}

interface StudentWorkPaneProps {
  exerciseTitle: string;
  exerciseSkill: "WRITING" | "SPEAKING";
  sections: Section[];
  answers: Answer[];
}

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function getMinWordCount(skill: string, sectionType?: string): number | null {
  if (skill !== "WRITING") return null;
  if (sectionType?.toLowerCase().includes("task 1") || sectionType?.toLowerCase().includes("w1")) return 150;
  return 250;
}

export function StudentWorkPane({
  exerciseTitle,
  exerciseSkill,
  sections,
  answers,
}: StudentWorkPaneProps) {
  const [promptOpen, setPromptOpen] = useState(true);

  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left text-sm font-medium hover:bg-muted/80">
            <span>{exerciseTitle}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${promptOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-3 rounded-lg border p-3">
              {sections.map((section, idx) => (
                <div key={idx}>
                  {section.instructions && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {section.instructions}
                    </p>
                  )}
                  {section.questions.map((q) =>
                    q.prompt ? (
                      <p
                        key={q.id}
                        className="mt-2 text-sm italic text-muted-foreground"
                      >
                        {q.prompt}
                      </p>
                    ) : null,
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {sections.map((section, sIdx) =>
          section.questions.map((question, qIdx) => {
            const answer = answerMap.get(question.id);
            const text =
              exerciseSkill === "WRITING"
                ? answer?.answer?.text
                : answer?.answer?.transcript;
            const wordCount = text ? getWordCount(text) : 0;
            const minWords = getMinWordCount(exerciseSkill, section.type);
            const showSeparator =
              sIdx < sections.length - 1 ||
              qIdx < section.questions.length - 1;

            return (
              <div key={question.id}>
                {sections.length > 1 || section.questions.length > 1 ? (
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Question {qIdx + 1}
                  </h3>
                ) : null}

                <div className="rounded-lg border p-4">
                  {text ? (
                    <div className="space-y-1">
                      {text.split("\n").map((paragraph, pIdx) => (
                        <p
                          key={pIdx}
                          className="text-sm leading-relaxed"
                        >
                          {paragraph || "\u00A0"}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      {exerciseSkill === "SPEAKING"
                        ? "No transcript available"
                        : "No answer submitted"}
                    </p>
                  )}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {minWords
                    ? `${wordCount} / ${minWords} min words`
                    : `${wordCount} words`}
                </div>

                {showSeparator && <Separator className="my-4" />}
              </div>
            );
          }),
        )}
      </div>
    </ScrollArea>
  );
}
