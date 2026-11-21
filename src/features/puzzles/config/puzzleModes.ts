import { Zap, Target, Skull, Brain, Swords, type LucideIcon } from "lucide-react";
import type { PuzzleMode } from "../types/puzzle.types";

export interface PuzzleModeConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  /** The mode's path under /puzzles/ (duels have a page of their own) */
  url: PuzzleMode | "duel";
  disabled?: boolean;
}

export const PUZZLE_MODES: PuzzleModeConfig[] = [
  {
    title: "Solve puzzles",
    description: "Train tactics at your own pace",
    icon: Target,
    iconColor: "text-primary",
    url: "infinite",
  },
  {
    title: "Puzzle Rush",
    description: "Solve as many as you can in 3 minutes",
    icon: Zap,
    iconColor: "text-blitz",
    url: "rush",
  },
  {
    title: "Survival",
    description: "Three lives. Each wrong move costs one",
    icon: Skull,
    iconColor: "text-loss",
    url: "survival",
  },
  {
    title: "Calculate first",
    description: "Enter the whole line before a piece moves. Three lives",
    icon: Brain,
    iconColor: "text-rapid",
    url: "calculate",
  },
  {
    title: "Puzzle duel",
    description: "Race a friend through the same puzzles for 3 minutes",
    icon: Swords,
    iconColor: "text-win",
    url: "duel",
  },
];
