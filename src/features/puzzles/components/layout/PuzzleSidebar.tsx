import { useState, useEffect } from "react";
import { usePuzzle } from "../../contexts";
import { PuzzleRushSidebar } from "../modes/PuzzleRushSidebar";
import { PuzzleSurvivalSidebar } from "../modes/PuzzleSurvivalSidebar";
import { PuzzleInfiniteSidebar } from "../modes/PuzzleInfiniteSidebar";
import { PuzzleGameOverDialog } from "../shared/PuzzleGameOverDialog";

export const PuzzleSidebar = () => {
  const context = usePuzzle();
  const { sessionStats, restart, mode, isGameOver } = context;
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);

  const isPuzzleGameOver =
    (mode === "rush" || mode === "survival") && isGameOver;

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
      {(mode === "rush" || mode === "survival") && (
        <PuzzleGameOverDialog
          isOpen={showGameOverDialog}
          score={mode === "rush" ? context.score : sessionStats.solved}
          mode={mode}
          {...(mode === "rush"
            ? { reason: context.endReason, best: context.best, isNewBest: context.isNewBest }
            : {})}
          onRestart={handleRestart}
          onClose={handleGameOverDialogClose}
        />
      )}
    </div>
  );
};
