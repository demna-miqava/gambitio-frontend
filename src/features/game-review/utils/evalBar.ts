import { EVAL_BAR } from "@/features/engine-analysis/constants";
import type { PositionEval } from "../types";
import { evalWinChance, toWinPercent } from "./winChance";
import { formatEval } from "./buildReview";

export interface EvalBarValue {
  /** White's share of the bar, 0-100 */
  whitePercent: number;
  /** Unsigned, like the engine's bar: "1.2", "M3", "1-0" */
  label: string;
  /** Signed, for screen readers: "Evaluation +1.2" */
  spokenLabel: string;
}

/**
 * A reviewed position on the evaluation bar, scaled like the live engine's
 * bar: 5-95% for centipawns so both sides always show, full for mates and
 * finished games.
 */
export function evalBarValue(evaluation: PositionEval): EvalBarValue {
  const spokenLabel = `Evaluation ${formatEval(evaluation)}`;
  switch (evaluation.type) {
    case "over":
      return { whitePercent: toWinPercent(evaluation.result), label: formatEval(evaluation), spokenLabel };
    case "mate":
      return {
        whitePercent: evaluation.value > 0 ? 100 : 0,
        label: `M${Math.abs(evaluation.value)}`,
        spokenLabel,
      };
    case "cp": {
      const percent = toWinPercent(evalWinChance(evaluation));
      return {
        whitePercent: Math.max(EVAL_BAR.minPercentage, Math.min(EVAL_BAR.maxPercentage, percent)),
        label: Math.abs(evaluation.value / 100).toFixed(1),
        spokenLabel,
      };
    }
  }
}
