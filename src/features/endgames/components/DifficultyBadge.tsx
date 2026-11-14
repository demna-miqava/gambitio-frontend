import { cn } from "@/lib/utils";
import type { EndgameDifficulty } from "../types";

const STYLES: Record<EndgameDifficulty, string> = {
  beginner: "bg-win-bg text-win",
  intermediate: "bg-gold-soft text-foreground",
  advanced: "bg-loss-bg text-loss",
};

const LABELS: Record<EndgameDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DifficultyBadge = ({ difficulty, className }: { difficulty: EndgameDifficulty; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
      STYLES[difficulty],
      className
    )}
  >
    {LABELS[difficulty]}
  </span>
);
