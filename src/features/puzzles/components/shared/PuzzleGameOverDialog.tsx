import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Skull, Trophy, XCircle } from "lucide-react";
import type { RushEndReason } from "../../utils/rushRun";

interface PuzzleGameOverDialogProps {
  isOpen: boolean;
  score: number;
  mode: "rush" | "survival" | "calculate";
  onRestart: () => void;
  onClose: () => void;
  /** Rush: what ended the run */
  reason?: RushEndReason | null;
  /** Rush, Calculate first: best score on this device */
  best?: number;
  isNewBest?: boolean;
}

// The close button is DialogContent's own, which has the touch hit area
export const PuzzleGameOverDialog = ({
  isOpen,
  score,
  mode,
  onRestart,
  onClose,
  reason,
  best,
  isNewBest = false,
}: PuzzleGameOverDialogProps) => {
  const strikesOut = mode === "rush" && reason === "strikes";
  let title = "Out of lives";
  if (mode === "rush") title = strikesOut ? "Three strikes" : "Time's up";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 font-display text-2xl">
            {mode === "survival" && <Skull className="size-6 text-loss" aria-hidden="true" />}
            {mode === "calculate" && <Brain className="size-6 text-rapid" aria-hidden="true" />}
            {mode === "rush" &&
              (strikesOut ? (
                <XCircle className="size-6 text-loss" aria-hidden="true" />
              ) : (
                <Clock className="size-6 text-blitz" aria-hidden="true" />
              ))}
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-center">
            You solved
            <span className="block py-2 font-display-num text-5xl text-foreground">
              {score}
            </span>
            {score === 1 ? "puzzle" : "puzzles"}
          </DialogDescription>
        </DialogHeader>
        {mode !== "survival" && best !== undefined && (
          <p
            className={
              isNewBest
                ? "flex items-center justify-center gap-1.5 rounded-lg bg-success-bg px-3 py-2 text-sm font-medium text-success"
                : "text-center text-sm text-muted-foreground"
            }
          >
            {isNewBest ? (
              <>
                <Trophy className="size-4" aria-hidden="true" />
                New personal best
              </>
            ) : (
              <>
                Personal best: <span className="font-medium tabular-nums text-foreground">{best}</span>
              </>
            )}
          </p>
        )}
        <DialogFooter className="sm:justify-center">
          <Button onClick={onRestart} className="w-full sm:w-auto">
            Play again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
