import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Lightbulb, LayoutGrid, Loader2, RotateCcw, Target, XCircle } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { MoveNavigationControls } from "@/features/game/components/MoveControls";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { MovesListView } from "@/features/game/components/MovesList";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { describeMove } from "@/features/play-bots/utils/describeMove";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, getEndgameExerciseRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { nextEndgameExercise } from "../data/exercises";
import { ENDGAME_ENGINE_RATING, useEndgameExercise } from "../hooks/useEndgameExercise";
import { useEndgameProgress, useRecordEndgameAttempt } from "../hooks/useEndgameProgress";
import type { EndgameExercise } from "../types";
import { objectiveLabel } from "../utils/objective";
import { movesLabel } from "../utils/format";
import { DifficultyBadge } from "./DifficultyBadge";
import { ExerciseAnalysis } from "./ExerciseAnalysis";

const ENGINE_NAME = "Stockfish";

/** How far into the objective's move budget the attempt is, in words. */
const budgetText = (exercise: EndgameExercise, playerMoves: number): string => {
  const { objective } = exercise;
  if (objective.type === "draw") return `Held ${playerMoves} of ${objective.surviveMoves} moves`;
  if (objective.maxMoves) return `${playerMoves} of ${objective.maxMoves} moves used`;
  return `${movesLabel(playerMoves)} played`;
};

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** An exercise in progress: the board against the engine, and the objective beside it. */
export const ExerciseView = ({ exercise }: { exercise: EndgameExercise }) => {
  const { username, image } = useUser();
  const {
    boardRef,
    history,
    positions,
    playerMoves,
    thinking,
    evaluation,
    result,
    attempt,
    engineError,
    pendingPromotion,
    selectPromotion,
    cancelPromotion,
    retry,
    submitTypedMove,
    navigation,
    orientation,
    flip,
    showArrow,
    isPlayerTurn,
  } = useEndgameExercise(exercise);
  useFlipBoardKey(flip);
  const [hintsShown, setHintsShown] = useState(0);
  // Off by default: the exercise is to find the moves yourself
  const [analysisOn, setAnalysisOn] = useState(false);
  const { byId } = useEndgameProgress();
  const progress = byId.get(exercise.id);
  const record = useRecordEndgameAttempt();
  const next = nextEndgameExercise(exercise.id);

  useDocumentTitle(
    result ? `${result.status === "success" ? "Solved" : "Try again"}: ${exercise.title}` : exercise.title
  );

  // Each finished attempt is saved once
  const recordedAttempt = useRef<number | null>(null);
  const { mutate: saveAttempt } = record;
  useEffect(() => {
    if (!result || recordedAttempt.current === attempt) return;
    recordedAttempt.current = attempt;
    saveAttempt(
      { exerciseId: exercise.id, success: result.status === "success", moves: playerMoves },
      { onError: () => toast.error("Couldn't save your result", { id: "endgame-save" }) }
    );
  }, [result, attempt, exercise.id, playerMoves, saveAttempt]);

  // R retries at once (not while typing a move)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "r" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat || isTypingTarget(event.target)) return;
      event.preventDefault();
      retry();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [retry]);

  const playerCode = exercise.playerColor === "white" ? "w" : "b";
  const lastMove = history.at(-1);
  const engineMoved = lastMove && lastMove.color !== playerCode;
  const announcement = engineError
    ? "The engine couldn't start. Try reloading the page."
    : [engineMoved && `${ENGINE_NAME} played ${describeMove(lastMove)}.`, result?.message ?? evaluation.message]
        .filter(Boolean)
        .join(" ");

  const status = engineError
    ? "The engine couldn't start. Try reloading the page."
    : result
      ? result.message
      : evaluation.message ||
        (thinking ? `${ENGINE_NAME} is thinking…` : isPlayerTurn ? "Your move" : "Waiting…");

  const boardLabel = [
    "Chess board",
    `You play ${exercise.playerColor}. ${objectiveLabel(exercise.objective)}`,
    lastMove &&
      `Last move: ${lastMove.color === playerCode ? "you" : ENGINE_NAME} played ${describeMove(lastMove)}`,
    result?.message ?? (isPlayerTurn ? "Your move" : undefined),
  ]
    .filter(Boolean)
    .join(". ");

  const shownFen = positions[navigation.currentIndex] ?? exercise.fen;

  const engineRow = {
    name: ENGINE_NAME,
    startingRating: ENDGAME_ENGINE_RATING,
    avatar: <BotAvatar rating={ENDGAME_ENGINE_RATING} className="size-8 rounded-lg" />,
  };
  const engineStatus = thinking ? (
    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />
  ) : undefined;
  const playerRow = {
    name: username,
    avatar: <PlayerAvatar username={username} avatarUrl={image} size="sm" />,
  };

  const board = (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={boardLabel}
      material={{ fen: shownFen, bottom: orientation }}
      // The player is at the bottom unless they flipped the board
      {...(orientation === exercise.playerColor
        ? { topPlayer: engineRow, topPlayerClock: engineStatus, bottomPlayer: playerRow }
        : { topPlayer: playerRow, bottomPlayer: engineRow, bottomPlayerClock: engineStatus })}
    >
      {pendingPromotion && (
        <PromotionSelector
          color={exercise.playerColor}
          square={pendingPromotion.to}
          onSelect={selectPromotion}
          onCancel={cancelPromotion}
          boardOrientation={orientation}
        />
      )}
    </BoardLayout>
  );

  const hints = exercise.hints.slice(0, hintsShown);

  const sidebar = (
    <div className="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card lg:p-4">
      <header className="space-y-1.5">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {exercise.category}
          <DifficultyBadge difficulty={exercise.difficulty} className="normal-case tracking-normal" />
        </p>
        <h1 className="font-display text-2xl font-medium text-foreground dark:text-cream">{exercise.title}</h1>
      </header>

      <section aria-label="Objective" className="space-y-3 rounded-xl border border-border/70 p-3">
        <div className="flex items-start gap-2.5">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{objectiveLabel(exercise.objective)}</p>
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

        <div
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
            result?.status === "success" && "bg-win-bg text-win",
            (result?.status === "failure" || engineError) && "bg-loss-bg text-loss",
            !result && !engineError && "bg-muted text-foreground"
          )}
        >
          {result?.status === "success" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {result?.status === "failure" && <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          <span>
            {result && <span className="font-semibold">{result.status === "success" ? "Solved. " : "Not this time. "}</span>}
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="md"
            variant={result?.status === "success" ? "outline" : "default"}
            onClick={retry}
            aria-keyshortcuts="r"
            disabled={history.length === 0 && !result}
          >
            <RotateCcw aria-hidden="true" /> Retry
            <kbd className="ml-1 hidden rounded border border-current/30 px-1 text-[0.65rem] font-normal opacity-70 sm:inline">
              R
            </kbd>
          </Button>
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

      <div className="space-y-2 lg:border-t lg:border-border/70 lg:pt-3">
        <div className="rounded-xl border border-border/70 bg-card px-1 py-1.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
          <MovesListView moves={history} activeIndex={navigation.currentIndex - 1} onSelect={navigation.goToMove} />
        </div>
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <MoveNavigationControls {...navigation} />
          </div>
          <FlipBoardButton onFlip={flip} orientation={orientation} />
        </div>
        {!result && !engineError && <TypedMoveInput onSubmit={submitTypedMove} />}
        <Link
          to={ROUTES.ENDGAMES}
          className="block pt-1 text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to the endgame lab
        </Link>
      </div>
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
