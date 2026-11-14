import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getEndgameExerciseRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { EndgameExercise, EndgameProgress } from "../types";
import { objectiveLabel } from "../utils/objective";
import { attemptsLabel, movesLabel } from "../utils/format";
import { DifficultyBadge } from "./DifficultyBadge";
import { MiniBoard } from "./MiniBoard";

interface ExerciseCardProps {
  exercise: EndgameExercise;
  progress: EndgameProgress | undefined;
  /** Progress is still loading */
  progressPending: boolean;
}

/** One exercise in the lab: its position, objective and how the player has done. */
export const ExerciseCard = ({ exercise, progress, progressPending }: ExerciseCardProps) => {
  const completed = Boolean(progress?.completedAt);
  const status = completed
    ? progress?.bestMoves != null
      ? `Completed, best ${movesLabel(progress.bestMoves)}`
      : "Completed"
    : progress?.attempts
      ? `Not solved yet, ${attemptsLabel(progress.attempts)}`
      : "New";

  return (
    <Link
      to={getEndgameExerciseRoute(exercise.id)}
      className={cn(
        "group flex gap-3 rounded-xl border border-border/70 bg-card p-3 transition-colors",
        "hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        completed && "border-win/30"
      )}
    >
      <MiniBoard fen={exercise.fen} orientation={exercise.playerColor} className="w-24 shrink-0 sm:w-28" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-foreground">{exercise.title}</h3>
          {completed ? (
            <CheckCircle2 className="size-5 shrink-0 text-win" aria-hidden="true" />
          ) : (
            <Circle className="size-5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{objectiveLabel(exercise.objective)}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1">
          <DifficultyBadge difficulty={exercise.difficulty} />
          {progressPending ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className={cn("text-xs tabular-nums", completed ? "text-win" : "text-muted-foreground")}>
              {status}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
