import type { TableGameState } from "./tableGame";
import { boardOf } from "./tableGame";

/**
 * Table games kept on the device: the one being played (so a reload, or
 * the phone locking, doesn't lose it) and finished games the server hasn't
 * stored yet (no connection at the table), to retry later. Storage can be
 * blocked or full: reads then come back empty and writes do nothing.
 */
export const CURRENT_KEY = "gambitio:table-game";
export const UNSAVED_KEY = "gambitio:table-unsaved";
/** Finished games kept for a retry at most */
const MAX_UNSAVED = 20;

/** What POST /games/table takes (backend saveTableGameSchema) */
export interface SaveTableGameBody {
  pgn: string;
  result: "white_win" | "black_win" | "draw";
  endReason: string;
  color: "white" | "black";
  whiteTime: number;
  blackTime: number;
  increment: number;
  opponent: { kind: "guest"; name: string } | { kind: "friend"; userId: number };
}

export interface UnsavedTableGame {
  /** The game's own id (TableGameState.id), so it's queued once */
  id: string;
  finishedAt: number;
  /** "You vs Bob", for the list */
  label: string;
  body: SaveTableGameBody;
}

const read = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked or full: the game goes on in memory
  }
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** A stored game in progress, or null if there is none or it doesn't make sense any more. */
export const parseTableGame = (value: unknown): TableGameState | null => {
  if (!isObject(value) || value.v !== 1 || typeof value.id !== "string") return null;
  const state = value as unknown as TableGameState;
  if (!isObject(state.setup) || !Array.isArray(state.moves) || !isObject(state.remaining)) return null;
  if (!["ready", "running", "paused", "over"].includes(state.status)) return null;
  if (typeof state.remaining.white !== "number" || typeof state.remaining.black !== "number") return null;
  try {
    boardOf(state);
  } catch {
    return null;
  }
  return state;
};

export const loadCurrentGame = () => parseTableGame(read(CURRENT_KEY));
export const storeCurrentGame = (state: TableGameState | null) => write(CURRENT_KEY, state);

export const loadUnsaved = (): UnsavedTableGame[] => {
  const value = read(UNSAVED_KEY);
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is UnsavedTableGame =>
      isObject(item) && typeof item.id === "string" && isObject(item.body) && typeof item.body.pgn === "string"
  );
};

/** Adds (or replaces) a finished game waiting to be saved. Newest first. */
export const queueUnsaved = (item: UnsavedTableGame) => {
  const rest = loadUnsaved().filter((other) => other.id !== item.id);
  write(UNSAVED_KEY, [item, ...rest].slice(0, MAX_UNSAVED));
};

export const removeUnsaved = (id: string) => {
  const rest = loadUnsaved().filter((item) => item.id !== id);
  write(UNSAVED_KEY, rest.length ? rest : null);
};
