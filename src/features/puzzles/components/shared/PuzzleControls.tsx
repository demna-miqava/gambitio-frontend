import { usePuzzle } from "../../contexts/PuzzleContext";
import PuzzleCardHeader from "./PuzzleCardHeader";
import { PuzzleActionButtons } from "./PuzzleActionButtons";
import { PuzzleThemes } from "./PuzzleThemes";
import { PuzzleAnalysis } from "./PuzzleAnalysis";
import { usePuzzleExploration } from "../../hooks/usePuzzleExploration";
import { PuzzleFeedNotice } from "./PuzzleFeedNotice";
import { PuzzleSolutionLine } from "./PuzzleSolutionLine";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";

export const PuzzleControls = () => {
  const context = usePuzzle();
  const { status, onRetry, onNextPuzzle, puzzle, onHint, onShowSolution, mode, wrongMove, revealed } =
    context;
  const exploration = usePuzzleExploration(status, puzzle?.id);
  const { orientation, flipBoard } = useChessBoardContext();
  useFlipBoardKey(flipBoard);
  // Timed modes only get the engine once the run is over
  const engineAllowed = mode === "infinite" || context.isGameOver;
  // Rush and Survival move on by themselves after each result
  const autoAdvance = mode !== "infinite";

  // The side to move in the puzzle's FEN is the side the player solves for
  const side = puzzle ? (puzzle.fen.split(" ")[1] === "b" ? "black" : "white") : undefined;
  const finished = status !== "solving";

  if (!puzzle) {
    return (
      <section className="w-full lg:rounded-2xl lg:bg-card lg:p-4">
        <PuzzleFeedNotice />
      </section>
    );
  }

  return (
    <section className="w-full space-y-3 lg:rounded-2xl lg:bg-card lg:p-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <PuzzleCardHeader
            status={status}
            side={side}
            rating={puzzle?.rating}
            wrongMove={status === "failed" ? wrongMove?.san : undefined}
            revealed={revealed}
            autoAdvance={autoAdvance}
          />
        </div>
        <FlipBoardButton onFlip={flipBoard} orientation={orientation} />
      </div>

      {!autoAdvance && status === "success" && <PuzzleSolutionLine puzzle={puzzle} />}

      <PuzzleActionButtons
        status={status}
        onRetry={onRetry}
        onNextPuzzle={onNextPuzzle}
        onHint={onHint}
        onShowSolution={onShowSolution}
        autoAdvance={autoAdvance}
      />

      {engineAllowed && <PuzzleAnalysis exploration={exploration} />}

      {/* Themes give the answer away, so they appear once the puzzle is over */}
      {finished && <PuzzleThemes themes={puzzle?.themes} />}
    </section>
  );
};
