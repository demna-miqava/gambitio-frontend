import { cn } from "@/lib/utils";
import type { EndgameDifficulty } from "../types";

const LABELS: Record<EndgameDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** An exercise's level, as plain small text. */
export const DifficultyBadge = ({ difficulty, className }: { difficulty: EndgameDifficulty; className?: string }) => (
  <span className={cn("text-xs text-muted-foreground", className)}>{LABELS[difficulty]}</span>
);
