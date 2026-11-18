import { useState, useEffect } from "react";
import { usePuzzle } from "../../contexts";
import { PuzzleRushSidebar } from "../modes/PuzzleRushSidebar";
import { PuzzleSurvivalSidebar } from "../modes/PuzzleSurvivalSidebar";
import { PuzzleInfiniteSidebar } from "../modes/PuzzleInfiniteSidebar";
import { PuzzleCalculateSidebar } from "../modes/PuzzleCalculateSidebar";
import { PuzzleGameOverDialog } from "../shared/PuzzleGameOverDialog";

export const PuzzleSidebar = () => {
  const context = usePuzzle();
  const { sessionStats, restart, mode, isGameOver } = context;
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);

  const hasRuns = mode === "rush" || mode === "survival" || mode === "calculate";
  // Calculate first: not before the missed line's solution has played out
  const isPuzzleGameOver = hasRuns && (mode === "calculate" ? context.runFinished : isGameOver);

  useEffect(() => {
    if (isPuzzleGameOver) {
      setShowGameOverDialog(true);
    }
  }, [isPuzzleGameOver]);

  const handleGameOverDialogClose = () => {
    setShowGameOverDialog(false);
  };

  const handleRestart = () => {
    setShowGameOverDialog(false);
    restart();
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {mode === "infinite" && <PuzzleInfiniteSidebar />}
      {mode === "rush" && <PuzzleRushSidebar />}
      {mode === "survival" && <PuzzleSurvivalSidebar />}
      {mode === "calculate" && <PuzzleCalculateSidebar />}
      {hasRuns && (
        <PuzzleGameOverDialog
          isOpen={showGameOverDialog}
          score={
            mode === "rush"
              ? context.score
              : mode === "calculate"
                ? context.history.filter(Boolean).length
                : sessionStats.solved
          }
          mode={mode}
          {...(mode === "rush"
            ? { reason: context.endReason, best: context.best, isNewBest: context.isNewBest }
            : {})}
          {...(mode === "calculate" ? { best: context.best, isNewBest: context.isNewBest } : {})}
          onRestart={handleRestart}
          onClose={handleGameOverDialogClose}
        />
      )}
    </div>
  );
};
