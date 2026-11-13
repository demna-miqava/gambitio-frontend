import type { PositionEval } from "../types";
import { ReviewAbortedError, ReviewEngine, type SearchLimits } from "./reviewEngine";

export interface RunReviewOptions {
  signal?: AbortSignal;
  /** Called after each position with how many are done */
  onProgress?: (done: number, total: number) => void;
  limits?: SearchLimits;
  /** For tests; a fresh Stockfish worker by default */
  engine?: ReviewEngine;
}

/**
 * Evaluates every position in order with a dedicated engine, which is
 * terminated when the run finishes, fails, or is aborted.
 */
export async function runReview(
  positions: string[],
  { signal, onProgress, limits, engine = new ReviewEngine() }: RunReviewOptions = {}
): Promise<PositionEval[]> {
  const abort = () => engine.terminate();
  signal?.addEventListener("abort", abort);
  try {
    const evals: PositionEval[] = [];
    onProgress?.(0, positions.length);
    for (const fen of positions) {
      if (signal?.aborted) throw new ReviewAbortedError();
      evals.push(await engine.evaluate(fen, limits));
      onProgress?.(evals.length, positions.length);
    }
    return evals;
  } finally {
    signal?.removeEventListener("abort", abort);
    engine.terminate();
  }
}
