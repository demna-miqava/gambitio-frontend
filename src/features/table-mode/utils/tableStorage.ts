import { z } from "zod";
import type { TableGameState } from "./tableGame";
import { boardOf } from "./tableGame";
import { userStore } from "@/utils/userStorage";

/**
 * Table games kept on the device: the one being played (so a reload, or
 * the phone locking, doesn't lose it) and finished games the server hasn't
 * stored yet (no connection at the table), to retry later. Storage can be
 * blocked or full: reads then come back empty and writes do nothing.
 *
 * Kept per account (userStore): the games name the recorder's friends, and
 * saving one writes it into the signed-in account's history, so the next
 * person to sign in on a shared device must not find them. Signing out
 * removes them with the account's other entries. They used to be stored
 * for the whole browser; those entries can't be told apart by account and
 * are dropped.
 */
const store = userStore("table", { legacyPrefix: "gambitio:table-" });
export const CURRENT_KEY = "game";
export const UNSAVED_KEY = "unsaved";

/**
 * Whether a "storage" event (a change made by another tab) may have changed
 * this account's list of unsaved games. A null key means everything was cleared.
 */
export const isUnsavedStorageKey = (key: string | null) =>
  key === null || (key.startsWith("gambitio:u:") && key.endsWith(`:table:${UNSAVED_KEY}`));
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
  /**
   * The game's own id (tableClientId): a repeat save of the same game
   * returns the one already stored instead of storing it twice
   */
  clientId?: string;
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
    const raw = store.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Blocked or full: the store keeps nothing and the game goes on in memory
const write = (key: string, value: unknown) => {
  if (value === null) store.remove(key);
  else store.set(key, JSON.stringify(value));
};

/**
 * What may be stored. Anything else (a damaged entry, or one from an older
 * version of the page) is dropped: a game that can't be read is better lost
 * than one that crashes the page or whose flag can never fall.
 */
const side = z.enum(["white", "black"]);
const resultKind = z.enum(["white_win", "black_win", "draw"]);
const endReason = z.enum([
  "checkmate",
  "stalemate",
  "insufficient_material",
  "threefold_repetition",
  "fifty_move_rule",
  "resignation",
  "draw_agreement",
  "timeout",
  "timeout_vs_insufficient_material",
]);
/** As the server allows (TIME_LIMITS): 15 s to 3 hours, increment to 3 minutes */
const clockSeconds = z.number().int().min(15).max(3 * 60 * 60);
const increment = z.number().int().min(0).max(180);
const time = z.number().nonnegative();
const name = z.string().min(1).max(100);
const userId = z.number().int().positive();

const tableGameSchema = z
  .object({
    v: z.literal(1),
    id: z.string().min(1).max(100),
    createdAt: time,
    setup: z.object({
      whiteTime: clockSeconds,
      blackTime: clockSeconds,
      increment,
      recorderColor: side,
      recorderName: name,
      opponent: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("guest"), name }),
        z.object({ kind: z.literal("friend"), userId, username: name }),
      ]),
      clockOnly: z.boolean(),
    }),
    moves: z.array(z.string().min(1).max(10)).max(2_000),
    turns: z.number().int().nonnegative(),
    turn: side,
    remaining: z.object({ white: time, black: time }),
    turnStartedAt: time.nullable(),
    status: z.enum(["ready", "running", "paused", "over"]),
    drawOffer: side.nullable(),
    result: z.object({ result: resultKind, endReason }).nullable(),
    endedAt: time.nullable(),
    savedGameId: userId.optional(),
  })
  // A running clock needs its start, and a finished game its result
  .refine((state) => state.status !== "running" || state.turnStartedAt !== null)
  .refine((state) => (state.status === "over") === (state.result !== null));

const unsavedSchema = z.object({
  id: z.string().min(1).max(100),
  finishedAt: time,
  label: z.string().max(200),
  body: z.object({
    pgn: z.string().min(1),
    result: resultKind,
    endReason,
    color: side,
    whiteTime: clockSeconds,
    blackTime: clockSeconds,
    increment,
    opponent: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("guest"), name }),
      z.object({ kind: z.literal("friend"), userId }),
    ]),
  }),
});

/** A stored game in progress, or null if there is none or it doesn't make sense any more. */
export const parseTableGame = (value: unknown): TableGameState | null => {
  const parsed = tableGameSchema.safeParse(value);
  if (!parsed.success) return null;
  const state: TableGameState = parsed.data;
  try {
    boardOf(state);
  } catch {
    return null;
  }
  return state;
};

/** The finished games waiting to be saved that still make sense (others are left out). */
export const parseUnsaved = (value: unknown): UnsavedTableGame[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = unsavedSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
};

export const loadCurrentGame = () => parseTableGame(read(CURRENT_KEY));
export const storeCurrentGame = (state: TableGameState | null) => write(CURRENT_KEY, state);

/**
 * The game on the device has been stored by the server (saved from the
 * "Not saved yet" list, say): it remembers that, so opening it again
 * doesn't save it a second time.
 */
export const markCurrentSaved = (id: string, gameId: number) => {
  const current = loadCurrentGame();
  if (current?.id === id && current.status === "over" && current.savedGameId === undefined) {
    storeCurrentGame({ ...current, savedGameId: gameId });
  }
};

/** Fired on this page whenever the list of unsaved games changes */
export const UNSAVED_CHANGED_EVENT = "gambitio:table-unsaved-changed";
const notifyUnsavedChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(UNSAVED_CHANGED_EVENT));
};

export const loadUnsaved = (): UnsavedTableGame[] => parseUnsaved(read(UNSAVED_KEY));

/** Adds (or replaces) a finished game waiting to be saved. Newest first. */
export const queueUnsaved = (item: UnsavedTableGame) => {
  const rest = loadUnsaved().filter((other) => other.id !== item.id);
  write(UNSAVED_KEY, [item, ...rest].slice(0, MAX_UNSAVED));
  notifyUnsavedChanged();
};

export const removeUnsaved = (id: string) => {
  const rest = loadUnsaved().filter((item) => item.id !== id);
  write(UNSAVED_KEY, rest.length ? rest : null);
  notifyUnsavedChanged();
};

/** What the server takes as a save's idempotency key: 8 to 64 of A-Z, a-z, 0-9, _ and - */
const CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * A game's id as the save's clientId. New games' ids already fit (see
 * newTableGameId); one stored by an older version of the page may hold
 * other characters ("1731…-0.123"), which become "_" (the old ids never had
 * one, so two games can't end up with the same key).
 */
export const tableClientId = (id: string): string => {
  if (CLIENT_ID.test(id)) return id;
  return id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64).padEnd(8, "_");
};
