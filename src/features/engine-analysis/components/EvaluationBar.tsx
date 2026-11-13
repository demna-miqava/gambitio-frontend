import { useEffect, useState } from "react";
import { useAnalysis } from "../contexts/EngineAnalysisContext";
import { formatScore, getWhitePercentage } from "../utils/engineAnalysis.utils";
import { EVAL_BAR } from "../constants";
import type { EvaluationLine } from "../types";
import { cn } from "@/lib/utils";

export const EvaluationBar = () => {
  const { analysis } = useAnalysis();
  const bestLine: EvaluationLine | undefined = analysis.lines[0];

  // What the bar shows. It only moves for results deep enough to trust
  // (the first few depths swing wildly), and it holds its value while a new
  // position is being analysed instead of dropping back to the middle.
  const [shown, setShown] = useState<EvaluationLine | null>(null);
  useEffect(() => {
    if (!bestLine) return;
    if (bestLine.depth >= EVAL_BAR.minDepth || bestLine.mate !== undefined) {
      setShown(bestLine);
    } else {
      // Nothing shown yet: better a rough value than an empty bar
      setShown((current) => current ?? bestLine);
    }
  }, [bestLine]);

  const whitePercentage = shown ? getWhitePercentage(shown) : 50;
  const label = shown ? formatScore(shown) : "0.0";

  return (
    <EvaluationBarView
      whitePercent={whitePercentage}
      label={label}
      spokenLabel={`Evaluation ${shown ? formatScore(shown, "white") : "0.0"}`}
    />
  );
};

interface EvaluationBarViewProps {
  /** White's share of the bar, 0-100 */
  whitePercent: number;
  /** Shown on the side that's ahead, e.g. "1.2" or "M3" */
  label: string;
  /** Accessible name, e.g. "Evaluation +1.2" */
  spokenLabel: string;
  /** Shown faded, e.g. when it's for another position than the board's */
  muted?: boolean;
}

/** The bar itself, for any source of evaluations (live engine or a game review). */
export const EvaluationBarView = ({ whitePercent, label, spokenLabel, muted = false }: EvaluationBarViewProps) => {
  const whiteAhead = whitePercent > 50;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-sm bg-neutral-600 transition-opacity",
        muted && "opacity-50"
      )}
      role="img"
      aria-label={spokenLabel}
    >
      {/* White portion: a transform (not height) so it animates on the GPU,
          with a long ease-out so new depths glide instead of stepping */}
      <div
        className="absolute inset-0 origin-bottom bg-neutral-200 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
        style={{ transform: `scaleY(${whitePercent / 100})` }}
      />

      {/* Score label, on the side that's ahead */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center py-2 writing-mode-vertical",
          whiteAhead ? "bottom-0" : "top-0"
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "text-[10px] font-bold tabular-nums",
            whiteAhead ? "text-neutral-800" : "text-neutral-200"
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
