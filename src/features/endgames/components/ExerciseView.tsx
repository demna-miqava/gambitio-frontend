import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Lightbulb, LayoutGrid, Target } from "lucide-react";
import { GameLayout } from "@/features/game/components/GameLayout";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";
import { startPlyOfFen } from "@/features/game/utils/moveListUtils";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, getEndgameExerciseRoute } from "@/constants/routes";
import { nextEndgameExercise } from "../data/exercises";
import { useEndgameExercise } from "../hooks/useEndgameExercise";
import { useEndgameProgress, useRecordEndgameAttempt } from "../hooks/useEndgameProgress";
import { useRecordAttemptOnce } from "../hooks/useRecordAttemptOnce";
import type { EndgameExercise } from "../types";
import { objectiveLabel } from "../utils/objective";
import { movesLabel } from "../utils/format";
import { practiceText, shownFenOf } from "../utils/practiceText";
import { DifficultyBadge } from "./DifficultyBadge";
import { ExerciseAnalysis } from "./ExerciseAnalysis";
import { PracticeBoard, PracticeMoves, PracticeStatus, RetryButton } from "./PracticeBoard";

/** How far into the objective's move budget the attempt is, in words. */
const budgetText = (exercise: EndgameExercise, playerMoves: number): string => {
  const { objective } = exercise;
  if (objective.type === "draw") return `Held ${playerMoves} of ${objective.surviveMoves} moves`;
  if (objective.type !== "convert" && objective.maxMoves) return `${playerMoves} of ${objective.maxMoves} moves used`;
  return `${movesLabel(playerMoves)} played`;
};

/** An exercise in progress: the board against the engine, and the objective beside it. */
export const ExerciseView = ({ exercise }: { exercise: EndgameExercise }) => {
  const game = useEndgameExercise(exercise);
  const { playerMoves, result, retry, showArrow, thinking } = game;
  useFlipBoardKey(game.flip);
  const [hintsShown, setHintsShown] = useState(0);
  // Off by default: the exercise is to find the moves yourself
  const [analysisOn, setAnalysisOn] = useState(false);
  const { byId } = useEndgameProgress();
  const progress = byId.get(exercise.id);
  const { mutate: saveAttempt } = useRecordEndgameAttempt();
  const next = nextEndgameExercise(exercise.id);

  useDocumentTitle(
    result ? `${result.status === "success" ? "Solved" : "Try again"}: ${exercise.title}` : exercise.title
  );

  // Each finished attempt is saved once
  useRecordAttemptOnce(game, (success, moves) =>
    saveAttempt(
      { exerciseId: exercise.id, success, moves },
      { onError: () => toast.error("Couldn't save your result", { id: "endgame-save" }) }
    )
  );

  // R retries at once (not while typing a move)
  useShortcutKey("r", retry);

  const { status, announcement, boardLabel } = practiceText(game, exercise);
  const shownFen = shownFenOf(game);
  const board = <PracticeBoard game={game} position={exercise} label={boardLabel} />;

  const hints = exercise.hints.slice(0, hintsShown);

  const sidebar = (
    <div className="flex flex-col gap-4 lg:rounded-2xl lg:bg-card lg:p-4">
      <header className="space-y-1.5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {exercise.category}
          <DifficultyBadge difficulty={exercise.difficulty} className="normal-case tracking-normal" />
        </p>
        <h1 className="font-display text-2xl text-foreground">{exercise.title}</h1>
      </header>

      <section aria-label="Objective" className="space-y-3 rounded-xl bg-card p-3">
        <div className="flex items-start gap-2.5">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{objectiveLabel(exercise.objective)}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {budgetText(exercise, playerMoves)}
              {exercise.par !== undefined && ` · par ${movesLabel(exercise.par)}`}
              {progress?.bestMoves != null && ` · your best ${movesLabel(progress.bestMoves)}`}
            </p>
          </div>
          {progress?.completedAt && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-win">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Done
            </span>
          )}
        </div>

        <PracticeStatus game={game}>
          {result && <span className="font-medium">{result.status === "success" ? "Solved. " : "Not this time. "}</span>}
          {status}
        </PracticeStatus>

        <div className="grid grid-cols-2 gap-2">
          <RetryButton game={game} onRetry={retry} />
          {next ? (
            <Button size="md" variant={result?.status === "success" ? "default" : "outline"} asChild>
              <Link to={getEndgameExerciseRoute(next.id)}>
                Next <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button size="md" variant="outline" asChild>
              <Link to={ROUTES.ENDGAMES}>
                <LayoutGrid aria-hidden="true" /> All exercises
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section aria-label="Lesson" className="space-y-2">
        <p className="text-sm text-muted-foreground">{exercise.lesson}</p>
        {hints.length > 0 && (
          <ol className="space-y-1.5" aria-label="Hints">
            {hints.map((hint, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-gold-soft px-3 py-2 text-sm text-foreground">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                {hint}
              </li>
            ))}
          </ol>
        )}
        {hintsShown < exercise.hints.length && (
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setHintsShown((n) => n + 1)}>
            <Lightbulb aria-hidden="true" />
            {hintsShown === 0 ? "Show a hint" : "Another hint"}
            <span className="tabular-nums text-muted-foreground">
              ({hintsShown + 1} of {exercise.hints.length})
            </span>
          </Button>
        )}
      </section>

      <ExerciseAnalysis
        exercise={exercise}
        fen={shownFen}
        enabled={analysisOn}
        onEnabledChange={setAnalysisOn}
        paused={thinking}
        onArrow={showArrow}
      />

      <PracticeMoves game={game} startPly={startPlyOfFen(exercise.fen)}>
        <Link
          to={ROUTES.ENDGAMES}
          className="block pt-1 text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to the endgame lab
        </Link>
      </PracticeMoves>
    </div>
  );

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <GameLayout board={board} sidebar={sidebar} />
    </>
  );
};
