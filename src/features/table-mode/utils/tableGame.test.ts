import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  newTableGame,
  tableGameReducer,
  tableGamePgn,
  timeLeft,
  flagResult,
  canStillMate,
  isInProgress,
  newTableGameId,
  type TableAction,
  type TableGameState,
  type TableSetup,
} from "./tableGame";
import { Chess } from "chess.js";
import { loadCurrentGame, loadUnsaved, queueUnsaved, removeUnsaved, storeCurrentGame } from "./tableStorage";
import { setStorageAccount } from "@/utils/userStorage";

const setup = (overrides: Partial<TableSetup> = {}): TableSetup => ({
  whiteTime: 60,
  blackTime: 60,
  increment: 2,
  recorderColor: "white",
  recorderName: "annie",
  opponent: { kind: "guest", name: "Bob" },
  clockOnly: false,
  ...overrides,
});
const run = (state: TableGameState, ...actions: TableAction[]) => actions.reduce(tableGameReducer, state);
const started = (overrides: Partial<TableSetup> = {}) =>
  run(newTableGame(setup(overrides), 0, "g1"), { type: "start", now: 1_000 });

describe("table game clocks", () => {
  it("runs the side to move's clock on the wall clock, with the increment after a move", () => {
    let s = started();
    expect(timeLeft(s, "white", 11_000)).toBe(50_000);
    expect(timeLeft(s, "black", 11_000)).toBe(60_000);
    s = run(s, { type: "move", san: "e4", now: 11_000 });
    expect(s.turn).toBe("black");
    expect(s.remaining.white).toBe(52_000);
    expect(timeLeft(s, "black", 14_000)).toBe(57_000);
    // Survives a reload: the state is plain data, the time comes from now
    const reloaded = JSON.parse(JSON.stringify(s)) as TableGameState;
    expect(timeLeft(reloaded, "black", 14_000)).toBe(57_000);
  });

  it("refuses illegal moves and moves out of turn", () => {
    const s = started();
    expect(run(s, { type: "move", san: "e5", now: 2_000 })).toBe(s);
    expect(run(s, { type: "tap", side: "white", now: 2_000 })).toBe(s);
    expect(run(newTableGame(setup(), 0, "g"), { type: "move", san: "e4", now: 1 }).moves).toEqual([]);
  });

  it("pauses and resumes without losing time", () => {
    let s = run(started(), { type: "pause", now: 6_000 });
    expect(s.status).toBe("paused");
    expect(timeLeft(s, "white", 600_000)).toBe(55_000);
    s = run(s, { type: "resume", now: 600_000 }, { type: "tick", now: 601_000 });
    expect(timeLeft(s, "white", 601_000)).toBe(54_000);
  });

  it("a flag falls on the clock; the server's rule for insufficient material", () => {
    const s = run(started(), { type: "tick", now: 61_001 });
    expect(s.status).toBe("over");
    expect(s.result).toEqual({ result: "black_win", endReason: "timeout" });
    expect(s.remaining.white).toBe(0);
    // A move after the flag fell is not taken: the flag decides
    const late = run(started(), { type: "move", san: "e4", now: 70_000 });
    expect(late.result?.endReason).toBe("timeout");
    expect(late.moves).toEqual([]);

    // White flags but Black has a bare king (after some captures): a draw
    const bare = { ...started(), moves: [] as string[] };
    expect(flagResult({ ...bare, moves: [] }, "white").endReason).toBe("timeout");
    expect(flagResult({ moves: ["e4", "d5", "exd5", "Qxd5"], setup: setup() }, "white").endReason).toBe("timeout");
  });

  it("who can still mate, as the server rules it", () => {
    expect(canStillMate(new Chess("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"), "black")).toBe(false);
    expect(canStillMate(new Chess("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"), "white")).toBe(true);
    expect(canStillMate(new Chess("4k3/8/8/8/8/8/8/2N1K3 w - - 0 1"), "white")).toBe(false);
    expect(canStillMate(new Chess("4k3/8/8/8/8/8/8/1NN1K3 w - - 0 1"), "white")).toBe(true);
  });

  it("checkmate and other board results end the game", () => {
    const s = run(
      started(),
      { type: "move", san: "f3", now: 2_000 },
      { type: "move", san: "e5", now: 3_000 },
      { type: "move", san: "g4", now: 4_000 },
      { type: "move", san: "Qh4#", now: 5_000 }
    );
    expect(s.status).toBe("over");
    expect(s.result).toEqual({ result: "black_win", endReason: "checkmate" });
    expect(tableGamePgn(s)).toContain("2. g4 Qh4#");
    expect(tableGamePgn(s)).toContain('[White "annie"]');
    expect(tableGamePgn(s)).toContain('[Result "0-1"]');
  });

  it("resignation and draw offers for each side", () => {
    const resigned = run(started(), { type: "resign", side: "white", now: 2_000 });
    expect(resigned.result).toEqual({ result: "black_win", endReason: "resignation" });

    let s = run(started(), { type: "offer_draw", side: "black" });
    expect(s.drawOffer).toBe("black");
    // The offerer can't accept their own offer
    expect(run(s, { type: "answer_draw", side: "black", accept: true, now: 2_000 })).toBe(s);
    s = run(s, { type: "answer_draw", side: "white", accept: false, now: 2_000 });
    expect(s.drawOffer).toBeNull();
    s = run(s, { type: "offer_draw", side: "white" }, { type: "answer_draw", side: "black", accept: true, now: 3_000 });
    expect(s.result).toEqual({ result: "draw", endReason: "draw_agreement" });
    // A move answers an offer by declining it
    const moved = run(started(), { type: "offer_draw", side: "white" }, { type: "move", san: "e4", now: 2_000 });
    expect(moved.drawOffer).toBeNull();
  });

  it("takes back the last move while paused, increment included", () => {
    const s = run(started(), { type: "move", san: "e4", now: 11_000 }, { type: "pause", now: 12_000 }, { type: "takeback" });
    expect(s.moves).toEqual([]);
    expect(s.turn).toBe("white");
    expect(s.remaining.white).toBe(50_000);
  });

  it("time odds", () => {
    const s = newTableGame(setup({ whiteTime: 300, blackTime: 60 }), 0, "g");
    expect(s.remaining).toEqual({ white: 300_000, black: 60_000 });
  });
});

describe("clock ticks", () => {
  it("a tick that changes nothing returns the same state, so the screen doesn't re-render", () => {
    const s = started();
    expect(tableGameReducer(s, { type: "tick", now: 5_000 })).toBe(s);
    const paused = run(s, { type: "pause", now: 2_000 });
    expect(tableGameReducer(paused, { type: "tick", now: 90_000 })).toBe(paused);
    // The flag falling is the one tick that does change it
    expect(tableGameReducer(s, { type: "tick", now: 61_000 }).status).toBe("over");
  });

  it("a clock read a moment before it started shows its full time", () => {
    const s = run(started(), { type: "move", san: "e4", now: 11_000 });
    // Black's half last read the time at 10_950, before its clock started
    expect(timeLeft(s, "black", 10_950)).toBe(60_000);
    expect(timeLeft(s, "black", 11_100)).toBe(59_900);
  });
});

describe("games on the device", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("only a finished game (or none) leaves room for a new one", () => {
    const ready = newTableGame(setup(), 0, "g1");
    expect(isInProgress(null)).toBe(false);
    expect(isInProgress(ready)).toBe(true);
    expect(isInProgress(started())).toBe(true);
    expect(isInProgress(run(started(), { type: "pause", now: 2_000 }))).toBe(true);
    expect(isInProgress(run(started(), { type: "resign", side: "white", now: 2_000 }))).toBe(false);
  });

  it("gives new games ids that can be sent as a save's clientId", () => {
    const valid = /^[A-Za-z0-9_-]{8,64}$/;
    expect(newTableGameId()).toMatch(valid);
    // Without crypto.randomUUID (an older browser, or an insecure origin)
    vi.stubGlobal("crypto", {});
    const fallback = newTableGameId();
    expect(fallback).toMatch(valid);
    expect(newTableGameId()).not.toBe(fallback);
  });
});

describe("clock only", () => {
  it("each side taps to end their turn; Black's tap starts the clock", () => {
    let s = newTableGame(setup({ clockOnly: true }), 0, "g");
    s = run(s, { type: "tap", side: "white", now: 500 });
    expect(s.status).toBe("ready");
    s = run(s, { type: "tap", side: "black", now: 1_000 });
    expect(s.status).toBe("running");
    expect(s.turn).toBe("white");
    s = run(s, { type: "tap", side: "white", now: 4_000 }, { type: "tap", side: "white", now: 5_000 });
    expect(s.turn).toBe("black");
    expect(s.turns).toBe(1);
    expect(s.remaining.white).toBe(59_000);
    // No board: moves don't apply, a flag is a plain loss
    expect(run(s, { type: "move", san: "e5", now: 6_000 })).toBe(s);
    expect(run(s, { type: "tick", now: 70_000 }).result).toEqual({ result: "white_win", endReason: "timeout" });
  });
});

describe("table storage", () => {
  // Tests run in Node: a minimal Storage, with an account signed in
  beforeEach(() => {
    setStorageAccount("user_a");
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

  it("keeps the game in progress and drops anything broken", () => {
    const s = run(started(), { type: "move", san: "e4", now: 2_000 });
    storeCurrentGame(s);
    expect(loadCurrentGame()).toEqual(s);
    localStorage.setItem("gambitio:u:user_a:table:game", JSON.stringify({ ...s, moves: ["e5"] }));
    expect(loadCurrentGame()).toBeNull();
    localStorage.setItem("gambitio:u:user_a:table:game", "{not json");
    expect(loadCurrentGame()).toBeNull();
    storeCurrentGame(null);
    expect(localStorage.getItem("gambitio:u:user_a:table:game")).toBeNull();
  });

  it("queues finished games to retry, once each", () => {
    const body = { pgn: "1. e4 *", result: "draw" as const, endReason: "draw_agreement", color: "white" as const, whiteTime: 60, blackTime: 60, increment: 0, opponent: { kind: "guest" as const, name: "Bob" } };
    queueUnsaved({ id: "a", finishedAt: 1, label: "x", body });
    queueUnsaved({ id: "b", finishedAt: 2, label: "y", body });
    queueUnsaved({ id: "a", finishedAt: 3, label: "x", body });
    expect(loadUnsaved().map((g) => g.id)).toEqual(["a", "b"]);
    removeUnsaved("a");
    removeUnsaved("b");
    expect(loadUnsaved()).toEqual([]);
    expect(localStorage.getItem("gambitio:u:user_a:table:unsaved")).toBeNull();
  });
});
