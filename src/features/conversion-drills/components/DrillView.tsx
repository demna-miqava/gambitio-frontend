import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ExternalLink, LayoutGrid, Target, Trash2 } from "lucide-react";
import { GameLayout } from "@/features/game/components/GameLayout";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, getArchiveGameRoute, getConversionDrillRoute } from "@/constants/routes";
import { useEndgameExercise } from "@/features/endgames/hooks/useEndgameExercise";
import { useRecordAttemptOnce } from "@/features/endgames/hooks/useRecordAttemptOnce";
import { formatAdvantage } from "@/features/endgames/utils/objective";
import { movesLabel } from "@/features/endgames/utils/format";
import { PRACTICE_ENGINE_NAME, practiceText } from "@/features/endgames/utils/practiceText";
import {
  PracticeBoard,
  PracticeMoves,
  PracticeStatus,
  RetryButton,
} from "@/features/endgames/components/PracticeBoard";
import type { PracticePosition } from "@/features/endgames/types";
import type { ConversionDrill } from "../types";
import { formatDrillEval } from "../utils/findDrill";
import { describeOrigin, moveNumberLabel, reviewLabel } from "../utils/describe";
import { isDue, useConversionDrills, useDeleteDrill, useRecordDrillAttempt } from "../hooks/useConversionDrills";

/**
 * A conversion drill in progress: the position from the player's game
 * against Stockfish at full strength. Converted means mate, or the engine
 * resigning; a draw, a loss or the advantage slipping fails the attempt.
 */
export const DrillView = ({ drill }: { drill: ConversionDrill }) => {
  const navigate = useNavigate();
  const position = useMemo<PracticePosition>(
    () => ({ fen: drill.fen, playerColor: drill.color, objective: { type: "convert" } }),
    [drill.fen, drill.color]
  );
  const game = useEndgameExercise(position);
  const { playerMoves, result, attempt, engineScore, retry, slipped } = game;
  useFlipBoardKey(game.flip);
  const { data: drills } = useConversionDrills();
  const current = drills?.find((d) => d.id === drill.id) ?? drill;
  // The next drill due, other than this one
  const next = drills?.find((d) => d.id !== drill.id && isDue(d));
  const { mutate: saveAttempt } = useRecordDrillAttempt();
  const remove = useDeleteDrill();

  useDocumentTitle(result ? `${result.status === "success" ? "Converted" : "Try again"}: conversion drill` : "Conversion drill");

  // Each finished attempt is saved once
  const recordedAttempt = useRecordAttemptOnce(game, (success, moves) =>
    saveAttempt(
      { drillId: drill.id, success, moves },
      { onError: () => toast.error("Couldn't save your result", { id: "drill-save" }) }
    )
  );

  // An attempt given up once the lead has dipped (a retry, or leaving the
  // drill) is a miss, not a do-over: otherwise a slipping attempt could
  // always be dropped before it fails. One that hasn't dipped is dropped.
  const abandonRef = useRef<() => void>(() => {});
  // A drill deleted from here has nothing left to record a miss on
  const removedRef = useRef(false);
  useEffect(() => {
    abandonRef.current = () => {
      if (removedRef.current || !slipped || result || recordedAttempt.current === attempt) return;
      recordedAttempt.current = attempt;
      saveAttempt({ drillId: drill.id, success: false, moves: playerMoves });
    };
  }, [slipped, result, attempt, drill.id, playerMoves, saveAttempt, recordedAttempt]);
  useEffect(() => {
    const abandon = abandonRef;
    return () => abandon.current();
  }, []);

  const restart = useCallback(() => {
    abandonRef.current();
    retry();
  }, [retry]);

  // R retries at once (not while typing a move)
  useShortcutKey("r", restart);

  // The engine's score is from its side; the player reads their own
  const advantage = engineScore && formatAdvantage({ type: engineScore.type, value: -engineScore.value });

  const { status, announcement, boardLabel } = practiceText(game, position);
  const board = <PracticeBoard game={game} position={position} label={boardLabel} />;

  const removeDrill = () =>
    remove.mutate(drill.id, {
      onSuccess: () => {
        removedRef.current = true;
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
            <p className="text-sm font-medium text-foreground">Win it against {PRACTICE_ENGINE_NAME} at full strength</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {movesLabel(playerMoves)} played
              {advantage && ` · advantage now ${advantage}`}
              {current.bestMoves != null && ` · your best ${movesLabel(current.bestMoves)}`}
            </p>
          </div>
        </div>

        <PracticeStatus game={game}>{status}</PracticeStatus>

        <div className="grid grid-cols-2 gap-2">
          <RetryButton game={game} onRetry={restart} />
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
        the game is drawn, the win has slipped. Retrying or leaving once your lead has dipped counts as a miss. A
        conversion brings the drill back later; a miss keeps it due.
      </p>

      <PracticeMoves game={game} startPly={drill.ply}>
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
