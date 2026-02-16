import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

interface CriteriaScores {
  taskAchievement?: number;
  coherence?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  fluency?: number;
  pronunciation?: number;
}

const WRITING_CRITERIA: { key: keyof CriteriaScores; label: string }[] = [
  { key: "taskAchievement", label: "Task Achievement" },
  { key: "coherence", label: "Coherence & Cohesion" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range & Accuracy" },
];

const SPEAKING_CRITERIA: { key: keyof CriteriaScores; label: string }[] = [
  { key: "fluency", label: "Fluency & Coherence" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range & Accuracy" },
  { key: "pronunciation", label: "Pronunciation" },
];

interface BandScoreCardProps {
  overallScore: number | null;
  criteriaScores: CriteriaScores | null;
  skill: "WRITING" | "SPEAKING";
}

export function BandScoreCard({
  overallScore,
  criteriaScores,
  skill,
}: BandScoreCardProps) {
  const criteria = skill === "WRITING" ? WRITING_CRITERIA : SPEAKING_CRITERIA;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm font-medium">Band Score</span>
          <span className="text-3xl font-bold text-primary">
            {overallScore ?? "—"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {criteria.map(({ key, label }) => {
            const score = criteriaScores?.[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">
                  {score != null ? score : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
