import type { LineVerdict } from "./calculateLine";

/**
 * One Calculate-first attempt at a puzzle:
 *
 *   entering ──submit──▶ replaying ──▶ done (solved / failed)
 *      ▲                     │
 *      └─────────────────────┘ a reply differed: the line is right up to
 *                              it, the real reply is played, and the rest
 *                              is entered from there
 *
 * The board stays put while entering; replaying plays the judged line out
 * on it. After a reply the solver predicted differently, the moves played
 * so far (the solution's, up to that reply) stay at the start of the line,
 * fixed, and only the rest is entered and judged again. That costs nothing;
 * a wrong move of the player's still does.
 */
export type CalculatePhase = "entering" | "replaying" | "done";

export interface CalculateAttempt {
  puzzleId: string | null;
  /**
   * The line, UCI, both sides' moves from the puzzle's position: the
   * `fixed` moves already played on the board, then the ones entered
   */
  entered: string[];
  /** Moves at the start of the line already played (the solution's): they can't be removed */
  fixed: number;
  phase: CalculatePhase;
  verdict: LineVerdict | null;
  /** The last reply predicted differently: where, and the move the solver expected (UCI) */
  differed: { index: number; predicted: string } | null;
}

export type CalculateAction =
  | { type: "reset"; puzzleId: string | null }
  | { type: "enter"; line: string[] }
  | { type: "removeLast" }
  | { type: "clear" }
  | { type: "submit"; verdict: LineVerdict }
  /** The judged line has played out; `solution` is the puzzle's */
  | { type: "replayed"; solution: readonly string[] };

export const initialCalculateAttempt = (puzzleId: string | null = null): CalculateAttempt => ({
  puzzleId,
  entered: [],
  fixed: 0,
  phase: "entering",
  verdict: null,
  differed: null,
});

/** The fixed start of `line` is `state`'s (an entry never changes the moves already played) */
const keepsFixed = (state: CalculateAttempt, line: readonly string[]) =>
  line.length >= state.fixed && state.entered.slice(0, state.fixed).every((move, i) => line[i] === move);

export const calculateAttemptReducer = (
  state: CalculateAttempt,
  action: CalculateAction
): CalculateAttempt => {
  switch (action.type) {
    case "reset":
      return state.puzzleId === action.puzzleId && state.phase === "entering" && state.entered.length === 0
        ? state
        : initialCalculateAttempt(action.puzzleId);
    case "enter":
      return state.phase === "entering" && keepsFixed(state, action.line) ? { ...state, entered: action.line } : state;
    case "removeLast":
      return state.phase === "entering" && state.entered.length > state.fixed
        ? { ...state, entered: state.entered.slice(0, -1) }
        : state;
    case "clear":
      return state.phase === "entering" && state.entered.length > state.fixed
        ? { ...state, entered: state.entered.slice(0, state.fixed) }
        : state;
    case "submit":
      return state.phase === "entering" ? { ...state, phase: "replaying", verdict: action.verdict } : state;
    case "replayed": {
      if (state.phase !== "replaying") return state;
      const { verdict } = state;
      if (verdict?.result !== "reply-differs") return { ...state, phase: "done" };
      // The solution up to the real reply is on the board now: enter the rest
      const fixed = verdict.index + 1;
      return {
        ...state,
        entered: action.solution.slice(0, fixed),
        fixed,
        phase: "entering",
        verdict: null,
        differed: { index: verdict.index, predicted: state.entered[verdict.index] ?? "" },
      };
    }
  }
};

/** The moves still to enter after the fixed start: the player's own, and the replies. */
export const movesToEnter = (solutionLength: number, fixed: number) => {
  const left = Math.max(0, solutionLength - fixed);
  // The fixed start ends on a reply, so the player moves first in the rest
  const own = Math.ceil(left / 2);
  return { own, replies: left - own };
};

/**
 * The run is over and done with: out of lives, and the last line (the
 * solution, after a miss) has finished playing on the board. The game-over
 * dialog waits for this.
 */
export const isRunFinished = (isGameOver: boolean, attempt: Pick<CalculateAttempt, "phase">) =>
  isGameOver && attempt.phase !== "replaying";
