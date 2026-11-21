import { useCallback, useEffect, useReducer, useState } from "react";
import type { Key } from "@lichess-org/chessground/types";
import { randomSquare } from "../utils/coordinates";
import { initialRun, runReducer, type RunAction, type RunState } from "../utils/runReducer";

/** How often the shown clock updates while a run is on */
const TICK_MS = 100;

type SessionAction = RunAction | { type: "start"; durationMs: number } | { type: "stop" };

/** No run (null) until started; stopping drops the run without a result. */
const sessionReducer = (state: RunState | null, action: SessionAction): RunState | null => {
  if (action.type === "start") {
    const target = randomSquare();
    return initialRun(action.durationMs, target, randomSquare(target));
  }
  if (action.type === "stop") return null;
  return state && runReducer(state, action);
};

/**
 * The drill's current run, or null before one starts: the targets, score
 * and misses (runReducer), the clock (it starts with the first click) and
 * the time left.
 */
export const useCoordinateRun = () => {
  const [run, dispatch] = useReducer(sessionReducer, null);
  const [now, setNow] = useState(() => performance.now());

  const next = run?.next;
  const click = useCallback(
    (square: Key) => dispatch({ type: "click", square, now: performance.now(), fresh: randomSquare(next) }),
    [next]
  );
  const start = useCallback((seconds: number) => dispatch({ type: "start", durationMs: seconds * 1000 }), []);
  const stop = useCallback(() => dispatch({ type: "stop" }), []);

  // The clock: a timer for the end, and a tick for the display
  const phase = run?.phase;
  const endsAt = run?.endsAt ?? null;
  useEffect(() => {
    if (phase !== "running" || endsAt === null) return;
    // The tick checks the end too, in case the timer fires a hair early
    const check = () => {
      const at = performance.now();
      setNow(at);
      dispatch({ type: "timeUp", now: at });
    };
    const tick = setInterval(check, TICK_MS);
    const end = setTimeout(check, Math.max(0, endsAt - performance.now()));
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [phase, endsAt]);

  let timeLeftMs = 0;
  if (run?.phase === "ready") timeLeftMs = run.durationMs;
  else if (run?.phase === "running" && endsAt !== null) timeLeftMs = Math.min(run.durationMs, Math.max(0, endsAt - now));

  return { run, timeLeftMs, click, start, stop };
};
