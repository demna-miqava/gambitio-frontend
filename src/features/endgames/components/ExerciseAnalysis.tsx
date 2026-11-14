import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatScore } from "@/features/engine-analysis/utils/engineAnalysis.utils";
import { cn } from "@/lib/utils";
import type { EndgameExercise } from "../types";
import { useEndgameAnalysis } from "../hooks/useEndgameAnalysis";
import { movesKeepingResult } from "../services/tablebase";
import { formatLine, objectiveNote, suggestedMove, verdictFor, verdictText } from "../utils/analysis";

const MAX_KEEPERS_SHOWN = 6;

interface ExerciseAnalysisProps {
  exercise: EndgameExercise;
  /** The position on the board (live, or one stepped back to) */
  fen: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** The opponent is thinking: hold the engine back */
  paused: boolean;
  /** Points at the suggested move on the board (UCI), or clears it */
  onArrow: (uci: string | null) => void;
}

/**
 * Optional help: the best line from the position on the board and, with
 * seven pieces or fewer, the tablebase's verdict and every move that keeps
 * it. Off until the player turns it on.
 */
export const ExerciseAnalysis = ({ exercise, fen, enabled, onEnabledChange, paused, onArrow }: ExerciseAnalysisProps) => {
  const analysis = useEndgameAnalysis({ fen, enabled, paused });
  const { engineLine, tablebase } = analysis;
  const playerToMove = (fen.split(" ")[1] === "b") === (exercise.playerColor === "black");

  const verdict = useMemo(
    () => verdictFor({ fen, playerColor: exercise.playerColor, tablebase, engineLine: engineLine?.line ?? null }),
    [fen, exercise.playerColor, tablebase, engineLine]
  );
  const engineMove = engineLine?.line.pv[0];
  const suggestion = enabled && !analysis.gameOver ? suggestedMove(engineMove, tablebase) : null;
  const keepers = tablebase && playerToMove ? movesKeepingResult(tablebase) : [];
  const note = objectiveNote(exercise.objective, verdict);

  useEffect(() => {
    onArrow(suggestion);
  }, [suggestion, onArrow]);
  useEffect(() => () => onArrow(null), [onArrow]);

  // The tablebase overruled Stockfish's first move: show its move instead of the line
  const overruled = suggestion !== null && engineMove !== undefined && suggestion !== engineMove;
  const line = engineLine && !overruled ? formatLine(engineLine.line.pv, fen) : null;
  const overrulingSan = overruled ? tablebase?.moves.find((move) => move.uci === suggestion)?.san : undefined;

  const keeperLabel =
    verdict?.outcome === "win" ? "Moves that keep the win" : verdict?.outcome === "draw" ? "Moves that hold the draw" : null;

  return (
    <section aria-label="Analysis" className="space-y-2 rounded-xl border border-border/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="endgame-analysis" className="text-sm font-semibold text-foreground">
          Analysis
        </Label>
        <Switch id="endgame-analysis" checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {!enabled ? (
        <p className="text-xs text-muted-foreground">
          Shows the best line from the position on the board, and whether it's still won or drawn.
        </p>
      ) : analysis.gameOver ? (
        <p className="text-xs text-muted-foreground">The game is over in this position.</p>
      ) : (
        <div className="space-y-2">
          {verdict && verdict.outcome !== "unknown" && (
            <p
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                verdict.outcome === "win" && "bg-win-bg text-win",
                verdict.outcome === "loss" && "bg-loss-bg text-loss",
                verdict.outcome === "draw" && "bg-muted text-foreground"
              )}
            >
              {verdictText(verdict)}
              <span className="ml-1.5 text-xs font-normal opacity-75">
                ({verdict.source === "tablebase" ? "tablebase" : "Stockfish"})
              </span>
            </p>
          )}
          {note && <p className="text-xs text-muted-foreground">{note}</p>}

          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Best line</span>
              <span className="flex items-center gap-1 tabular-nums">
                {(analysis.analyzing || (!analysis.engineReady && !analysis.engineError)) && (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                )}
                {engineLine && `Depth ${engineLine.depth}`}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground">
              {analysis.engineError ? (
                <span className="text-loss">The analysis engine couldn't start.</span>
              ) : overrulingSan ? (
                <>
                  <span className="font-semibold">{overrulingSan}</span>
                  <span className="text-muted-foreground"> (from the tablebase)</span>
                </>
              ) : line ? (
                <>
                  <span className="mr-2 font-semibold tabular-nums">{formatScore(engineLine!.line, exercise.playerColor)}</span>
                  {line}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {paused ? "Waiting for the opponent's move…" : !analysis.engineReady ? "Starting the engine…" : "Analysing…"}
                </span>
              )}
            </p>
          </div>

          {keeperLabel && keepers.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {keeperLabel}:{" "}
              <span className="font-medium text-foreground">
                {keepers
                  .slice(0, MAX_KEEPERS_SHOWN)
                  .map((move) => move.san)
                  .join(", ")}
              </span>
              {keepers.length > MAX_KEEPERS_SHOWN && ` and ${keepers.length - MAX_KEEPERS_SHOWN} more`}
            </p>
          )}
          {analysis.hasTablebase && analysis.tablebaseError && (
            <p className="text-xs text-muted-foreground">The tablebase couldn't be reached; showing Stockfish only.</p>
          )}
        </div>
      )}
    </section>
  );
};
