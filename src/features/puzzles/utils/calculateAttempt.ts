import type { LineVerdict } from "./calculateLine";

/**
 * One Calculate-first attempt at a puzzle:
 *
 *   entering ──submit──▶ replaying ──▶ done (solved / failed)
 *                            └──────▶ finishing (a reply differed: the
 *                                     player plays on move by move)
 *
 * The board stays on the starting position while entering; replaying plays
 * the judged line out on it.
 */
export type CalculatePhase = "entering" | "replaying" | "finishing" | "done";

export interface CalculateAttempt {
  puzzleId: string | null;
  /** The entered line, UCI, both sides' moves */
  entered: string[];
  phase: CalculatePhase;
  verdict: LineVerdict | null;
}

export type CalculateAction =
  | { type: "reset"; puzzleId: string | null }
  | { type: "enter"; line: string[] }
  | { type: "removeLast" }
  | { type: "clear" }
  | { type: "submit"; verdict: LineVerdict }
  | { type: "replayed" };

export const initialCalculateAttempt = (puzzleId: string | null = null): CalculateAttempt => ({
  puzzleId,
  entered: [],
  phase: "entering",
  verdict: null,
});

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
      return state.phase === "entering" ? { ...state, entered: action.line } : state;
    case "removeLast":
      return state.phase === "entering" && state.entered.length > 0
        ? { ...state, entered: state.entered.slice(0, -1) }
        : state;
    case "clear":
      return state.phase === "entering" && state.entered.length > 0 ? { ...state, entered: [] } : state;
    case "submit":
      return state.phase === "entering" ? { ...state, phase: "replaying", verdict: action.verdict } : state;
    case "replayed":
      if (state.phase !== "replaying") return state;
      return { ...state, phase: state.verdict?.result === "reply-differs" ? "finishing" : "done" };
  }
};
