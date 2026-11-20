import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveTableGame } from "@/services/game";
import { newTableGame, tableGameReducer } from "./tableGame";
import {
  UNSAVED_CHANGED_EVENT,
  loadCurrentGame,
  loadUnsaved,
  queueUnsaved,
  storeCurrentGame,
  tableClientId,
  type UnsavedTableGame,
} from "./tableStorage";
import { saveUnsavedTableGame, toUnsaved } from "./tableSave";
import { setStorageAccount } from "@/utils/userStorage";

vi.mock("@/services/game", () => ({ saveTableGame: vi.fn() }));
const save = vi.mocked(saveTableGame);

const item = (id: string): UnsavedTableGame => ({
  id,
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
});

/** A finished game on the device with the given id */
const finishedGame = (id: string) =>
  tableGameReducer(
    tableGameReducer(
      tableGameReducer(
        newTableGame(
          {
            whiteTime: 300,
            blackTime: 300,
            increment: 0,
            recorderColor: "white",
            recorderName: "annie",
            opponent: { kind: "guest", name: "Bob" },
            clockOnly: false,
          },
          0,
          id
        ),
        { type: "start", now: 1 }
      ),
      { type: "move", san: "e4", now: 2 }
    ),
    { type: "resign", side: "black", now: 3 }
  );

const names = { white: "annie", black: "Bob" };

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const stored = (id: number) => ({ id }) as Awaited<ReturnType<typeof saveTableGame>>;

describe("saveUnsavedTableGame", () => {
  let changes: number;

  beforeEach(() => {
    setStorageAccount("user_a");
    const items = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
      removeItem: (key: string) => void items.delete(key),
    });
    // The page's window, for the "unsaved games changed" event
    const target = new EventTarget();
    changes = 0;
    target.addEventListener(UNSAVED_CHANGED_EVENT, () => (changes += 1));
    vi.stubGlobal("window", target);
    save.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the game's id as the clientId", async () => {
    save.mockResolvedValue(stored(9));
    await saveUnsavedTableGame(item("1731840000000-0.5"));
    expect(save).toHaveBeenCalledWith({ ...item("x").body, clientId: tableClientId("1731840000000-0.5") });
    expect(save.mock.calls[0]![0].clientId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it("sends one request while a save of the same game is on its way", async () => {
    const reply = deferred<ReturnType<typeof stored>>();
    save.mockReturnValue(reply.promise);
    // The play screen's save, then the "Not saved yet" list's for the same game
    const first = saveUnsavedTableGame(item("game-0001"));
    const second = saveUnsavedTableGame(item("game-0001"));
    expect(save).toHaveBeenCalledTimes(1);
    reply.resolve(stored(9));
    await expect(first).resolves.toEqual(stored(9));
    await expect(second).resolves.toEqual(stored(9));
  });

  it("takes a stored game off the list and marks the game on the device saved", async () => {
    storeCurrentGame(finishedGame("game-0001"));
    queueUnsaved(item("game-0001"));
    queueUnsaved(item("game-0002"));
    changes = 0;
    save.mockResolvedValue(stored(9));
    await saveUnsavedTableGame(item("game-0001"));
    expect(loadUnsaved().map((g) => g.id)).toEqual(["game-0002"]);
    expect(loadCurrentGame()?.savedGameId).toBe(9);
    // The list on the page hears of it
    expect(changes).toBe(1);
  });

  it("keeps a game that couldn't be saved, and tries again when asked", async () => {
    storeCurrentGame(finishedGame("game-0001"));
    queueUnsaved(item("game-0001"));
    save.mockRejectedValueOnce(new Error("offline"));
    await expect(saveUnsavedTableGame(item("game-0001"))).rejects.toThrow("offline");
    expect(loadUnsaved().map((g) => g.id)).toEqual(["game-0001"]);
    expect(loadCurrentGame()?.savedGameId).toBeUndefined();

    save.mockResolvedValueOnce(stored(9));
    await saveUnsavedTableGame(item("game-0001"));
    expect(save).toHaveBeenCalledTimes(2);
    expect(loadUnsaved()).toEqual([]);
  });

  it("a game saved from the list isn't saved again once opened", async () => {
    // What the play screen does on opening a finished game: it only saves
    // one the device doesn't remember as saved
    storeCurrentGame(finishedGame("game-0001"));
    queueUnsaved(item("game-0001"));
    save.mockResolvedValue(stored(9));
    await saveUnsavedTableGame(item("game-0001"));
    const reopened = loadCurrentGame()!;
    expect(reopened.savedGameId).toBe(9);
    expect(toUnsaved(reopened, names)).toBeNull();
  });

  it("has the play screen save a finished game the server doesn't have", () => {
    const over = finishedGame("game-0001");
    expect(toUnsaved(over, names)).toMatchObject({
      id: "game-0001",
      label: "annie vs Bob",
      body: { result: "white_win", endReason: "resignation", opponent: { kind: "guest", name: "Bob" } },
    });
    expect(toUnsaved({ ...over, setup: { ...over.setup, clockOnly: true } }, names)).toBeNull();
    expect(toUnsaved({ ...over, moves: [] }, names)).toBeNull();
  });
});
