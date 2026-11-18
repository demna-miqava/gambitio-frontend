import { useCallback, useEffect, useReducer } from "react";
import { tableGameReducer, type TableAction, type TableGameState } from "../utils/tableGame";
import { storeCurrentGame } from "../utils/tableStorage";

/** How often a running clock re-reads the time (shown to the tenth under 10 s) */
const TICK_MS = 100;

type Action = TableAction | { type: "replace"; state: TableGameState };

const reducer = (state: TableGameState, action: Action) =>
  action.type === "replace" ? action.state : tableGameReducer(state, action);

/**
 * A table game in play: the reducer, stored on the device after every
 * change (so a reload or a locked phone keeps it), and a tick while a clock
 * runs, which ends the game when a flag falls. `now` is the time of the
 * last render, for showing the clocks.
 */
export const useTableGame = (initial: TableGameState) => {
  const [state, dispatchRaw] = useReducer(reducer, initial);
  const [now, setNow] = useReducer((_: number, next: number) => next, Date.now());

  useEffect(() => {
    storeCurrentGame(state);
  }, [state]);

  const running = state.status === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      dispatchRaw({ type: "tick", now: at });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  /** Actions that take the time get it from the wall clock here */
  const dispatch = useCallback((action: TableAction) => {
    dispatchRaw(action);
    setNow(Date.now());
  }, []);

  return { state, now, dispatch };
};
