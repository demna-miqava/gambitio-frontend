import { Cpu, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EngineAnalysisPanel } from "@/features/engine-analysis";
import type { usePuzzleExploration } from "../../hooks/usePuzzleExploration";

type Exploration = ReturnType<typeof usePuzzleExploration>;

/** Engine lines + free exploration, offered once a puzzle is finished. */
export const PuzzleAnalysis = ({ exploration }: { exploration: Exploration }) => {
  const { canExplore, active, fen, start, stop, resetPosition, playUci } = exploration;
  if (!canExplore) return null;

  if (!active) {
    return (
      <Button size="md" variant="outline" className="w-full" onClick={start}>
        <Cpu /> Analyze with engine
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-3">
      <p className="text-xs text-muted-foreground">
        Move pieces on the board to explore, or tap a line to play its first move.
      </p>
      {fen && <EngineAnalysisPanel fen={fen} numLines={3} onPlayMove={playUci} />}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" onClick={resetPosition}>
          <RotateCcw /> Reset position
        </Button>
        <Button variant="ghost" size="sm" onClick={stop}>
          <X /> Close analysis
        </Button>
      </div>
    </div>
  );
};
