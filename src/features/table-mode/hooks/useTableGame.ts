import { useEffect, useReducer, useState } from "react";
import { tableGameReducer, type TableAction, type TableGameState } from "../utils/tableGame";
import { storeCurrentGame } from "../utils/tableStorage";

/** How often a running clock re-reads the time (shown to the tenth under 10 s) */
export const TICK_MS = 100;

/**
 * The time, re-read every TICK_MS while `running`, for the one clock that
 * shows it: only that component re-renders on a tick, not the board.
 */
export const useNow = (running: boolean): number => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // Until the first tick the clock shows its time as of the start (timeLeft
    // counts an earlier `now` as no time gone)
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [running]);
  return now;
};

type Action = TableAction | { type: "replace"; state: TableGameState };

const reducer = (state: TableGameState, action: Action) =>
  action.type === "replace" ? action.state : tableGameReducer(state, action);

/**
 * A table game in play: the reducer, stored on the device after every
 * change (so a reload or a locked phone keeps it), and a tick while a clock
 * runs, which ends the game when a flag falls. A tick that changes nothing
 * returns the same state, so the game's screen doesn't re-render for it;
 * the clocks read the time themselves (useNow).
 */
export const useTableGame = (initial: TableGameState) => {
  const [state, dispatchRaw] = useReducer(reducer, initial);

  useEffect(() => {
    storeCurrentGame(state);
  }, [state]);

  const running = state.status === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => dispatchRaw({ type: "tick", now: Date.now() }), TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const dispatch: (action: TableAction) => void = dispatchRaw;
  return { state, dispatch };
};
