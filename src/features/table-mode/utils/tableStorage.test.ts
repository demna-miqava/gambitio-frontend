import { beforeEach, describe, expect, it } from "vitest";
import { newTableGame, newTableGameId, tableGameReducer, type TableGameState } from "./tableGame";
import {
  CURRENT_KEY,
  UNSAVED_KEY,
  loadCurrentGame,
  loadUnsaved,
  markCurrentSaved,
  parseTableGame,
  parseUnsaved,
  storeCurrentGame,
  tableClientId,
  type UnsavedTableGame,
} from "./tableStorage";

/** Tests run in Node: a minimal Storage */
const useMemoryStorage = () =>
  beforeEach(() => {
    const items = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
      key: (i: number) => [...items.keys()][i] ?? null,
      get length() {
        return items.size;
      },
    } as Storage;
  });

const game = (): TableGameState => {
  const ready = newTableGame(
    {
      whiteTime: 300,
      blackTime: 180,
      increment: 2,
      recorderColor: "white",
      recorderName: "annie",
      opponent: { kind: "friend", userId: 7, username: "bob" },
      clockOnly: false,
    },
    1_000,
    "0d6f5c1e-8a4b-4c1f-9d3e-2b7a6c5d4e3f"
  );
  return [
    { type: "start", now: 2_000 },
    { type: "move", san: "e4", now: 3_000 },
  ].reduce((s, a) => tableGameReducer(s, a as Parameters<typeof tableGameReducer>[1]), ready);
};

const finished = (): TableGameState => tableGameReducer(game(), { type: "resign", side: "black", now: 4_000 });

const unsaved = (overrides: Partial<UnsavedTableGame> = {}): UnsavedTableGame => ({
  id: "g-1",
  finishedAt: 5_000,
  label: "annie vs Bob",
  body: {
    pgn: "1. e4 1-0",
    result: "white_win",
    endReason: "resignation",
    color: "white",
    whiteTime: 300,
    blackTime: 300,
    increment: 0,
    opponent: { kind: "guest", name: "Bob" },
  },
  ...overrides,
});

describe("parseTableGame", () => {
  it("reads back every state a game can be in", () => {
    for (const state of [newTableGame(game().setup, 0, "abcdefgh"), game(), finished()]) {
      expect(parseTableGame(JSON.parse(JSON.stringify(state)))).toEqual(state);
    }
    expect(parseTableGame({ ...finished(), savedGameId: 12 })?.savedGameId).toBe(12);
  });

  it("drops anything damaged instead of letting it crash the page", () => {
    const s = game();
    const broken: unknown[] = [
      null,
      "game",
      { ...s, v: 2 },
      { ...s, setup: { ...s.setup, opponent: undefined } },
      { ...s, setup: { ...s.setup, opponent: { kind: "friend", userId: 7 } } },
      { ...s, setup: { ...s.setup, recorderColor: "red" } },
      { ...s, turn: "green" },
      { ...s, moves: ["e5"] },
      { ...s, moves: [1] },
      { ...s, drawOffer: "maybe" },
      { ...s, result: { result: "white_win", endReason: "boredom" } },
    ];
    for (const value of broken) expect(parseTableGame(value)).toBeNull();
  });

  it("drops clocks that could never run out", () => {
    const s = game();
    // NaN and Infinity don't survive JSON, but a string or a missing value can be stored
    expect(parseTableGame({ ...s, setup: { ...s.setup, increment: "2" } })).toBeNull();
    expect(parseTableGame({ ...s, setup: { ...s.setup, whiteTime: 0 } })).toBeNull();
    expect(parseTableGame({ ...s, remaining: { white: "50000", black: 10 } })).toBeNull();
    expect(parseTableGame({ ...s, remaining: { white: -1, black: 10 } })).toBeNull();
    expect(parseTableGame({ ...s, turnStartedAt: null })).toBeNull();
    expect(parseTableGame({ ...s, turnStartedAt: "now" })).toBeNull();
    // Over, but without a result (or the other way round)
    expect(parseTableGame({ ...s, status: "over" })).toBeNull();
    expect(parseTableGame({ ...finished(), result: null })).toBeNull();
  });
});

describe("parseUnsaved", () => {
  it("keeps the readable entries and leaves out the rest", () => {
    const good = unsaved();
    const list = [
      good,
      { ...good, id: "g-2", finishedAt: undefined },
      { ...good, id: "g-3", label: 4 },
      { ...good, id: "g-4", body: { ...good.body, pgn: "" } },
      { ...good, id: "g-5", body: { ...good.body, result: "won" } },
      { ...good, id: "g-6", body: { ...good.body, opponent: { kind: "friend", userId: "7" } } },
      "junk",
      unsaved({ id: "g-7" }),
    ];
    expect(parseUnsaved(list).map((g) => g.id)).toEqual(["g-1", "g-7"]);
    expect(parseUnsaved({ not: "a list" })).toEqual([]);
  });
});

describe("table storage", () => {
  useMemoryStorage();

  it("loads a stored game, and nothing from a damaged entry", () => {
    storeCurrentGame(game());
    expect(loadCurrentGame()).toEqual(game());
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ ...game(), setup: {} }));
    expect(loadCurrentGame()).toBeNull();
    localStorage.setItem(UNSAVED_KEY, JSON.stringify([unsaved(), { id: "x" }]));
    expect(loadUnsaved().map((g) => g.id)).toEqual(["g-1"]);
  });

  it("marks the game on the device saved when the server has stored it", () => {
    const over = finished();
    storeCurrentGame(over);
    // Another game's save leaves it alone
    markCurrentSaved("someone-else", 4);
    expect(loadCurrentGame()?.savedGameId).toBeUndefined();
    markCurrentSaved(over.id, 41);
    expect(loadCurrentGame()?.savedGameId).toBe(41);
    // Once saved, it stays the first stored game
    markCurrentSaved(over.id, 42);
    expect(loadCurrentGame()?.savedGameId).toBe(41);
  });

  it("never marks a game still in progress", () => {
    storeCurrentGame(game());
    markCurrentSaved(game().id, 41);
    expect(loadCurrentGame()?.savedGameId).toBeUndefined();
  });
});

describe("tableClientId", () => {
  const valid = /^[A-Za-z0-9_-]{8,64}$/;

  it("uses a new game's id as it is", () => {
    const id = newTableGameId();
    expect(id).toMatch(valid);
    expect(tableClientId(id)).toBe(id);
  });

  it("turns an older game's id into a valid key, the same every time", () => {
    const old = "1731840000000-0.8364721937";
    expect(tableClientId(old)).toMatch(valid);
    expect(tableClientId(old)).toBe(tableClientId(old));
    expect(tableClientId(old)).not.toBe(tableClientId("1731840000000-0.8364721938"));
    expect(tableClientId("g1")).toMatch(valid);
    expect(tableClientId("x".repeat(100))).toMatch(valid);
  });
});
