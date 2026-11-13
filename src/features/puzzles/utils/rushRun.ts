import { PUZZLE_CONFIG } from "../constants/puzzle.constants";

/**
 * Puzzle Rush run, as a pure reducer:
 *
 *   ready ──start──▶ countdown (3-2-1) ──▶ playing ──time / 3 strikes──▶ over
 *                        ▲                                              │
 *                        └──────────────────start (play again)──────────┘
 *
 * Time is passed in (`now`, ms) so the clock follows the wall clock rather
 * than counting interval callbacks, which drift and stall in background tabs.
 */
export type RushPhase = "ready" | "countdown" | "playing" | "over";
export type RushEndReason = "time" | "strikes";

export interface RushRunState {
  phase: RushPhase;
  /** When the countdown or the clock runs out (ms), null outside them */
  phaseEndsAt: number | null;
  /** Seconds left in the 3-2-1 countdown */
  countdown: number;
  /** Seconds left on the clock */
  timeLeft: number;
  /** Puzzles solved this run */
  score: number;
  /** Wrong moves this run */
  strikes: number;
  endReason: RushEndReason | null;
  /** Personal best when the run started, to tell a new best apart */
  previousBest: number;
}

export type RushRunAction =
  | { type: "start"; now: number; best: number }
  | { type: "tick"; now: number }
  | { type: "solved" }
  | { type: "failed" };

export const RUSH_RULES = {
  DURATION_MS: PUZZLE_CONFIG.RUSH.DURATION_SECONDS * 1000,
  COUNTDOWN_MS: PUZZLE_CONFIG.RUSH.COUNTDOWN_SECONDS * 1000,
  MAX_STRIKES: PUZZLE_CONFIG.RUSH.MAX_STRIKES,
} as const;

export const initialRushRun = (best = 0): RushRunState => ({
  phase: "ready",
  phaseEndsAt: null,
  countdown: PUZZLE_CONFIG.RUSH.COUNTDOWN_SECONDS,
  timeLeft: PUZZLE_CONFIG.RUSH.DURATION_SECONDS,
  score: 0,
  strikes: 0,
  endReason: null,
  previousBest: best,
});

const secondsLeft = (endsAt: number, now: number) =>
  Math.max(0, Math.ceil((endsAt - now) / 1000));

export const rushRunReducer = (
  state: RushRunState,
  action: RushRunAction
): RushRunState => {
  switch (action.type) {
    case "start":
      if (state.phase === "countdown" || state.phase === "playing") return state;
      return {
        ...initialRushRun(action.best),
        phase: "countdown",
        phaseEndsAt: action.now + RUSH_RULES.COUNTDOWN_MS,
      };

    case "tick": {
      if (state.phaseEndsAt === null) return state;
      if (state.phase === "countdown") {
        if (action.now >= state.phaseEndsAt) {
          // The clock starts from the moment the board unlocks, so a late
          // tick never eats into the player's three minutes
          return {
            ...state,
            phase: "playing",
            countdown: 0,
            phaseEndsAt: action.now + RUSH_RULES.DURATION_MS,
            timeLeft: PUZZLE_CONFIG.RUSH.DURATION_SECONDS,
          };
        }
        const countdown = secondsLeft(state.phaseEndsAt, action.now);
        return countdown === state.countdown ? state : { ...state, countdown };
      }
      if (state.phase === "playing") {
        const timeLeft = secondsLeft(state.phaseEndsAt, action.now);
        if (timeLeft === 0) {
          return { ...state, phase: "over", phaseEndsAt: null, timeLeft: 0, endReason: "time" };
        }
        return timeLeft === state.timeLeft ? state : { ...state, timeLeft };
      }
      return state;
    }

    case "solved":
      if (state.phase !== "playing") return state;
      return { ...state, score: state.score + 1 };

    case "failed": {
      if (state.phase !== "playing") return state;
      const strikes = state.strikes + 1;
      if (strikes >= RUSH_RULES.MAX_STRIKES) {
        return { ...state, strikes, phase: "over", phaseEndsAt: null, endReason: "strikes" };
      }
      return { ...state, strikes };
    }
  }
};

/** A finished run that beat the best from before it (a first run of 0 doesn't count). */
export const isNewPersonalBest = (state: RushRunState) =>
  state.phase === "over" && state.score > 0 && state.score > state.previousBest;

/** Parses the stored best, ignoring anything that isn't a sane count. */
export const parsePersonalBest = (value: unknown): number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
