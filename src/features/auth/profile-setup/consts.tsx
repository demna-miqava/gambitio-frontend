import { Crown, Shield, Sparkles, Trophy } from "lucide-react";
import type { SkillOption } from "./types";

export const SKILL_OPTIONS: SkillOption[] = [
  {
    value: "new",
    title: "New to chess",
    description: "Learning the rules. Start against gentle opponents and easy bots.",
    badge: "Most common",
    icon: <Sparkles className="size-6" />,
  },
  {
    value: "beginner",
    title: "Beginner",
    description: "You play casually and want to sharpen your tactics with puzzles.",
    icon: <Shield className="size-6" />,
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "You know your openings and want stronger opponents.",
    icon: <Trophy className="size-6" />,
  },
  {
    value: "advanced",
    title: "Advanced",
    description: "You play seriously and review your games in the analysis board.",
    icon: <Crown className="size-6" />,
  },
];
