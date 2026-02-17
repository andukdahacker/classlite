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

function getBandColor(score: number): string {
  if (score >= 7) return "text-green-600 dark:text-green-400";
  if (score >= 5.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getBandBg(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 5.5) return "bg-amber-500";
  return "bg-red-500";
}

interface StudentScoreDisplayProps {
  overallScore: number | null;
  criteriaScores: CriteriaScores | null;
  skill: string;
}

export function StudentScoreDisplay({
  overallScore,
  criteriaScores,
  skill,
}: StudentScoreDisplayProps) {
  const criteria = skill === "WRITING" ? WRITING_CRITERIA : SPEAKING_CRITERIA;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm font-medium">Band Score</span>
          <span
            className={`text-3xl font-bold ${overallScore != null ? getBandColor(overallScore) : ""}`}
          >
            {overallScore != null ? overallScore : "—"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual band scale */}
        {overallScore != null && (
          <div className="mb-4">
            <div className="relative h-2 rounded-full bg-muted">
              <div
                className={`absolute left-0 top-0 h-2 rounded-full transition-all ${getBandBg(overallScore)}`}
                style={{ width: `${(overallScore / 9) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>4.5</span>
              <span>9</span>
            </div>
          </div>
        )}

        {/* Criteria breakdown */}
        {criteriaScores && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {criteria.map(({ key, label }) => {
              const score = criteriaScores[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">
                    {label}
                  </span>
                  <span
                    className={`text-sm font-semibold ${score != null ? getBandColor(score) : ""}`}
                  >
                    {score != null ? score : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
