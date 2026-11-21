import type { Key } from "@lichess-org/chessground/types";

/**
 * One run of the drill:
 * - "ready": the first target is shown and the clock is full; it starts
 *   with the first click, which counts
 * - "running": until `endsAt`
 * - "finished": the clock ran out
 */
export type RunPhase = "ready" | "running" | "finished";

export interface Feedback {
  kind: "right" | "wrong";
  square: Key;
  /** Counts up with every click, so the same feedback twice still shows twice */
  id: number;
}

export interface RunState {
  phase: RunPhase;
  durationMs: number;
  target: Key;
  next: Key;
  score: number;
  misses: number;
  endsAt: number | null;
  feedback: Feedback | null;
}

export type RunAction =
  | { type: "click"; square: Key; now: number; fresh: Key }
  | { type: "timeUp"; now: number };

export const initialRun = (durationMs: number, target: Key, next: Key): RunState => ({
  phase: "ready",
  durationMs,
  target,
  next,
  score: 0,
  misses: 0,
  endsAt: null,
  feedback: null,
});

/**
 * `fresh` is a random square other than `next`, drawn by the caller (the
 * reducer stays pure): it becomes the new "next" after a right click.
 */
export const runReducer = (state: RunState, action: RunAction): RunState => {
  switch (action.type) {
    case "click": {
      if (state.phase === "finished") return state;
      if (state.endsAt !== null && action.now >= state.endsAt) return { ...state, phase: "finished" };
      const started =
        state.phase === "ready"
          ? { phase: "running" as const, endsAt: action.now + state.durationMs }
          : {};
      const id = (state.feedback?.id ?? 0) + 1;
      if (action.square === state.target) {
        return {
          ...state,
          ...started,
          score: state.score + 1,
          target: state.next,
          next: action.fresh,
          feedback: { kind: "right", square: action.square, id },
        };
      }
      // A miss: the same target stays
      return {
        ...state,
        ...started,
        misses: state.misses + 1,
        feedback: { kind: "wrong", square: action.square, id },
      };
    }
    case "timeUp":
      if (state.phase !== "running" || state.endsAt === null || action.now < state.endsAt) return state;
      return { ...state, phase: "finished" };
  }
};
