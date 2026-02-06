import type { ExerciseSkill } from "@workspace/types";
import { Book, Headphones, Mic, Pen } from "lucide-react";

const SKILLS: {
  value: ExerciseSkill;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "READING",
    label: "Reading",
    description: "Passages with comprehension questions",
    icon: <Book className="size-8" />,
  },
  {
    value: "LISTENING",
    label: "Listening",
    description: "Audio-based comprehension exercises",
    icon: <Headphones className="size-8" />,
  },
  {
    value: "WRITING",
    label: "Writing",
    description: "Essay and report writing tasks",
    icon: <Pen className="size-8" />,
  },
  {
    value: "SPEAKING",
    label: "Speaking",
    description: "Interview and discussion prompts",
    icon: <Mic className="size-8" />,
  },
];

interface SkillSelectorProps {
  onSelect: (skill: ExerciseSkill) => void;
}

export function SkillSelector({ onSelect }: SkillSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Select Exercise Skill
        </h2>
        <p className="text-muted-foreground mt-2">
          Choose the IELTS skill for this exercise.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {SKILLS.map((skill) => (
          <button
            key={skill.value}
            onClick={() => onSelect(skill.value)}
            className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted p-6 transition-colors hover:border-primary hover:bg-accent"
          >
            <div className="rounded-full bg-muted p-4">{skill.icon}</div>
            <div className="text-center">
              <div className="font-semibold">{skill.label}</div>
              <div className="text-sm text-muted-foreground">
                {skill.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
