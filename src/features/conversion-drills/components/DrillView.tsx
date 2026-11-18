import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, ExternalLink, LayoutGrid, Loader2, RotateCcw, Target, Trash2, XCircle } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { MoveNavigationControls } from "@/features/game/components/MoveControls";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { SettingsMovesListView } from "@/features/game/components/MovesList";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { describeMove } from "@/features/play-bots/utils/describeMove";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, getArchiveGameRoute, getConversionDrillRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { ENDGAME_ENGINE_RATING, useEndgameExercise } from "@/features/endgames/hooks/useEndgameExercise";
import { formatAdvantage, objectiveLabel } from "@/features/endgames/utils/objective";
import { movesLabel } from "@/features/endgames/utils/format";
import type { PracticePosition } from "@/features/endgames/types";
import type { ConversionDrill } from "../types";
import { formatDrillEval } from "../utils/findDrill";
import { describeOrigin, moveNumberLabel, reviewLabel } from "../utils/describe";
import { isDue, useConversionDrills, useDeleteDrill, useRecordDrillAttempt } from "../hooks/useConversionDrills";

const ENGINE_NAME = "Stockfish";

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * A conversion drill in progress: the position from the player's game
 * against Stockfish at full strength. Converted means mate, or the engine
 * resigning; a draw, a loss or the advantage slipping fails the attempt.
 */
export const DrillView = ({ drill }: { drill: ConversionDrill }) => {
  const { username, image } = useUser();
  const navigate = useNavigate();
  const position = useMemo<PracticePosition>(
    () => ({ fen: drill.fen, playerColor: drill.color, objective: { type: "convert" } }),
    [drill.fen, drill.color]
  );
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
    engineScore,
    pendingPromotion,
    selectPromotion,
    cancelPromotion,
    retry,
    submitTypedMove,
    navigation,
    orientation,
    flip,
    isPlayerTurn,
  } = useEndgameExercise(position);
  useFlipBoardKey(flip);
  const { data: drills } = useConversionDrills();
  const current = drills?.find((d) => d.id === drill.id) ?? drill;
  // The next drill due, other than this one
  const next = drills?.find((d) => d.id !== drill.id && isDue(d));
  const { mutate: saveAttempt } = useRecordDrillAttempt();
  const remove = useDeleteDrill();

  useDocumentTitle(result ? `${result.status === "success" ? "Converted" : "Try again"}: conversion drill` : "Conversion drill");

  // Each finished attempt is saved once
  const recordedAttempt = useRef<number | null>(null);
  useEffect(() => {
    if (!result || recordedAttempt.current === attempt) return;
    recordedAttempt.current = attempt;
    saveAttempt(
      { drillId: drill.id, success: result.status === "success", moves: playerMoves },
      { onError: () => toast.error("Couldn't save your result", { id: "drill-save" }) }
    );
  }, [result, attempt, drill.id, playerMoves, saveAttempt]);

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

  const playerCode = drill.color === "white" ? "w" : "b";
  const lastMove = history.at(-1);
  const engineMoved = lastMove && lastMove.color !== playerCode;
  // The engine's score is from its side; the player reads their own
  const advantage = engineScore && formatAdvantage({ type: engineScore.type, value: -engineScore.value });

  const status = engineError
    ? "The engine couldn't start. Try reloading the page."
    : result
      ? result.message
      : evaluation.message ||
        (thinking ? `${ENGINE_NAME} is thinking…` : isPlayerTurn ? "Your move" : "Waiting…");
  const announcement = engineError
    ? status
    : [engineMoved && `${ENGINE_NAME} played ${describeMove(lastMove)}.`, result?.message ?? evaluation.message]
        .filter(Boolean)
        .join(" ");

  const boardLabel = [
    "Chess board",
    `You play ${drill.color}. ${objectiveLabel(position.objective)}`,
    lastMove &&
      `Last move: ${lastMove.color === playerCode ? "you" : ENGINE_NAME} played ${describeMove(lastMove)}`,
    result?.message ?? (isPlayerTurn ? "Your move" : undefined),
  ]
    .filter(Boolean)
    .join(". ");

  const shownFen = positions[navigation.currentIndex] ?? drill.fen;
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
      {...(orientation === drill.color
        ? { topPlayer: engineRow, topPlayerClock: engineStatus, bottomPlayer: playerRow }
        : { topPlayer: playerRow, bottomPlayer: engineRow, bottomPlayerClock: engineStatus })}
    >
      {pendingPromotion && (
        <PromotionSelector
          color={drill.color}
          square={pendingPromotion.to}
          onSelect={selectPromotion}
          onCancel={cancelPromotion}
          boardOrientation={orientation}
        />
      )}
    </BoardLayout>
  );

  const removeDrill = () =>
    remove.mutate(drill.id, {
      onSuccess: () => {
        toast.success("Drill removed");
        navigate(ROUTES.CONVERSION_DRILLS);
      },
      onError: () => toast.error("Couldn't remove the drill"),
    });

  const sidebar = (
    <div className="flex flex-col gap-4 lg:rounded-2xl lg:bg-card lg:p-4">
      <header className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Conversion drill · {describeOrigin(current)}</p>
        <h1 className="font-display text-2xl text-foreground">
          {moveNumberLabel(drill.ply)}: you were <span className="tabular-nums">{formatDrillEval(drill.eval)}</span>
        </h1>
      </header>

      <section aria-label="Objective" className="space-y-3 rounded-xl bg-card p-3">
        <div className="flex items-start gap-2.5">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Win it against {ENGINE_NAME} at full strength</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {movesLabel(playerMoves)} played
              {advantage && ` · advantage now ${advantage}`}
              {current.bestMoves != null && ` · your best ${movesLabel(current.bestMoves)}`}
            </p>
          </div>
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
          <span>{status}</span>
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
            <Button size="md" variant={result ? "default" : "outline"} asChild>
              <Link to={getConversionDrillRoute(next.id)}>
                Next drill <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button size="md" variant="outline" asChild>
              <Link to={ROUTES.CONVERSION_DRILLS}>
                <LayoutGrid aria-hidden="true" /> All drills
              </Link>
            </Button>
          )}
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">{reviewLabel(current)}</p>
      </section>

      <p className="text-sm text-muted-foreground">
        Stockfish resigns once it sees a forced mate or is hopelessly behind. If your lead drops under +1.5, or
        the game is drawn, the win has slipped. A conversion brings the drill back later; a miss keeps it due.
      </p>

      <div className="space-y-2 lg:border-t lg:border-border lg:pt-3">
        <div className="rounded-xl bg-card px-1 py-1.5 lg:rounded-none lg:bg-transparent lg:p-0">
          <SettingsMovesListView
            moves={history}
            activeIndex={navigation.currentIndex - 1}
            onSelect={navigation.goToMove}
            startPly={drill.ply}
          />
        </div>
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <MoveNavigationControls {...navigation} />
          </div>
          <FlipBoardButton onFlip={flip} orientation={orientation} />
        </div>
        {!result && !engineError && <TypedMoveInput onSubmit={submitTypedMove} />}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to={getArchiveGameRoute(drill.gameId)}>
              <ExternalLink aria-hidden="true" /> Open the game
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="-mr-2 text-muted-foreground" onClick={removeDrill} disabled={remove.isPending}>
            <Trash2 aria-hidden="true" /> Remove drill
          </Button>
        </div>
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
