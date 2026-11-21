import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chess } from "chess.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QKEY_DUEL } from "@/constants/queryKeys";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { DuelMoveResult, DuelState, ShownPuzzle } from "../types";
import { positionAfter } from "../utils/duel";
import { useDuelGame, type DuelGame } from "./useDuelGame";

// The hook is rendered once, on the server renderer: what it returns for a
// state is read from that render, and its message handlers and playMove are
// captured from the hooks it passes them to (effects don't run there, and
// state set afterwards changes nothing: what a move does is read from the
// board, the requests and the toasts)
const handlers = new Map<string, (message: unknown) => void>();
const mocks = vi.hoisted(() => ({
  cg: { set: vi.fn(), state: { dom: { bounds: { clear: vi.fn() } } } },
  picker: null as null | {
    chessRef: { current: Chess };
    playMove: (from: string, to: string, promotion?: string) => void;
  },
  getDuel: vi.fn(),
  sendDuelMove: vi.fn(),
  toastError: vi.fn(),
  playSoundForMove: vi.fn(),
}));

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1 }) }));
vi.mock("@/hooks/useMessageDispatcher", () => ({
  useMessageDispatcher: (_dispatcher: unknown, type: string, handler: (message: unknown) => void) => {
    handlers.set(type, handler);
  },
}));
vi.mock("@/services/websocketMessageDispatcher", () => ({ notificationMessages: {} }));
vi.mock("@/features/game/hooks/useChessground", () => ({
  useChessground: () => ({ boardRef: { current: null }, cgRef: { current: mocks.cg } }),
}));
vi.mock("@/features/game/hooks/useBoardSettings", () => ({ useBoardSettings: () => ({ autoQueen: false }) }));
vi.mock("@/features/game/hooks/usePromotionPicker", () => ({
  usePromotionPicker: (
    _cgRef: unknown,
    chessRef: { current: Chess },
    playMove: (from: string, to: string, promotion?: string) => void
  ) => {
    mocks.picker = { chessRef, playMove };
    return { pendingPromotion: null, setPendingPromotion: () => {}, selectPromotion: () => {} };
  },
}));
vi.mock("@/features/game/contexts/ChessSoundContext", () => ({
  useChessSound: () => ({ playSoundForMove: mocks.playSoundForMove, playGameEndSound: () => {} }),
}));
vi.mock("@/services/puzzleDuels", () => ({ getDuel: mocks.getDuel, sendDuelMove: mocks.sendDuelMove }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

const DUEL_ID = 7;
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const NOW = new Date("2026-11-21T12:00:00Z").getTime();

const puzzle = (over: Partial<ShownPuzzle> = {}): ShownPuzzle => ({ index: 3, fen: START, played: [], rating: 900, ...over });

/** A duel half a minute in, the viewer (player 1) on its fourth puzzle */
const duel = (over: Partial<DuelState> = {}): DuelState => ({
  id: DUEL_ID,
  status: "active",
  serverNow: NOW,
  startsAt: NOW - 30_000,
  endsAt: NOW + 150_000,
  endedAt: null,
  endReason: null,
  winnerId: null,
  rematchOf: null,
  maxStrikes: 3,
  players: [
    { userId: 2, username: "rook_lift", avatarUrl: null, score: 1, strikes: 0, out: false },
    {
      userId: 1,
      username: "queenside",
      avatarUrl: null,
      score: 2,
      strikes: 1,
      out: false,
      results: [
        { index: 0, solved: true },
        { index: 1, solved: false },
        { index: 2, solved: true },
      ],
    },
  ],
  puzzle: puzzle(),
  finishedPuzzles: [],
  ...over,
});

const moveResult = (over: Partial<DuelMoveResult> = {}): DuelMoveResult => ({
  outcome: "continue",
  move: "e2e4",
  reply: "e7e5",
  finishedPuzzle: null,
  nextPuzzle: null,
  score: 2,
  strikes: 1,
  out: false,
  ...over,
});

/** The duel page's hook for `state` (none: still loading), with the board on the puzzle as its effect would put it */
const setup = (state?: DuelState) => {
  const queryClient = new QueryClient();
  if (state) queryClient.setQueryData([QKEY_DUEL, DUEL_ID], state);
  handlers.clear();
  mocks.picker = null;
  let game!: DuelGame;
  const Harness = () => {
    game = useDuelGame(DUEL_ID);
    return null;
  };
  renderToStaticMarkup(createElement(QueryClientProvider, { client: queryClient }, createElement(Harness)));
  const { chessRef, playMove } = mocks.picker!;
  if (state?.puzzle) chessRef.current = positionAfter(state.puzzle.fen, state.puzzle.played);
  mocks.cg.set.mockClear();
  const send = (type: string, data: object) => handlers.get(type)!({ type, data });
  return { game, queryClient, chessRef, playMove, send };
};

/** A refusal as axios reports it, with the server's words */
const refused = (error: string) => ({ isAxiosError: true, response: { data: { error } } });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  for (const mock of [mocks.getDuel, mocks.sendDuelMove, mocks.toastError, mocks.playSoundForMove, mocks.cg.set]) {
    mock.mockReset();
  }
  mocks.getDuel.mockImplementation(async () => duel());
});
afterEach(() => {
  vi.useRealTimers();
});

describe("what the duel page shows for the server's state", () => {
  it("is loading until the duel has been read", () => {
    const { game } = setup();
    expect(game.phase).toBe("loading");
    expect(game.isLoading).toBe(true);
    expect(game.puzzle).toBeNull();
  });

  it("counts down before the start, with no puzzle yet", () => {
    const { game } = setup(duel({ startsAt: NOW + 4_000, endsAt: NOW + 184_000, puzzle: null }));
    expect(game.phase).toBe("countdown");
    expect(game.puzzle).toBeNull();
  });

  it("is being played once the countdown is over: the viewer below, the other player's score above", () => {
    const { game } = setup(duel());
    expect(game.phase).toBe("playing");
    expect(game.puzzle).toEqual(puzzle());
    expect(game.me).toMatchObject({ userId: 1, score: 2, strikes: 1, out: false });
    expect(game.me?.results).toHaveLength(3);
    expect(game.opponent).toMatchObject({ userId: 2, username: "rook_lift", score: 1, strikes: 0 });
    expect(game.color).toBe("white");
  });

  it("solves from the side to move in the puzzle", () => {
    const blackToMove = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    expect(setup(duel({ puzzle: puzzle({ fen: blackToMove }) })).game.color).toBe("black");
  });

  it("is out after the third strike, while the other player goes on", () => {
    const state = duel({ puzzle: null });
    state.players[1] = { ...state.players[1]!, strikes: 3, out: true };
    expect(setup(state).game.phase).toBe("out");
  });

  it("waits for the scores once the clock has run out", () => {
    expect(setup(duel({ endsAt: NOW - 500 })).game.phase).toBe("waiting");
  });

  it("is over when the server says so, whatever the clock", () => {
    const { game } = setup(duel({ status: "finished", winnerId: 1, endReason: "both_out", endedAt: NOW - 1_000, puzzle: null }));
    expect(game.phase).toBe("over");
  });
});

describe("playing a move", () => {
  it("shows it at once, locks the board and sends it with the puzzle's place in the duel", () => {
    mocks.sendDuelMove.mockReturnValue(new Promise(() => {}));
    const { playMove, chessRef } = setup(duel());
    playMove("e2", "e4");
    expect(mocks.sendDuelMove).toHaveBeenCalledWith(DUEL_ID, 3, "e2e4");
    expect(chessRef.current.history()).toEqual(["e4"]);
    const shown = mocks.cg.set.mock.calls.at(-1)![0];
    expect(shown.fen).toBe(chessRef.current.fen());
    expect(shown.lastMove).toEqual(["e2", "e4"]);
    expect(shown.movable.color).toBeUndefined();
    expect(mocks.playSoundForMove).toHaveBeenCalledTimes(1);
  });

  it("sends a promotion with its piece", () => {
    mocks.sendDuelMove.mockReturnValue(new Promise(() => {}));
    const { playMove } = setup(duel({ puzzle: puzzle({ fen: "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1" }) }));
    playMove("e7", "e8", "n");
    expect(mocks.sendDuelMove).toHaveBeenCalledWith(DUEL_ID, 3, "e7e8n");
  });

  it("doesn't send a move the position doesn't allow", () => {
    const { playMove, chessRef } = setup(duel());
    playMove("e2", "e5");
    expect(mocks.sendDuelMove).not.toHaveBeenCalled();
    expect(chessRef.current.history()).toEqual([]);
  });

  it.each([
    ["before the countdown ends", duel({ startsAt: NOW + 4_000, endsAt: NOW + 184_000 })],
    ["once the clock has run out", duel({ endsAt: NOW - 500 })],
    ["after the duel", duel({ status: "finished", winnerId: 2, endReason: "time", endedAt: NOW - 500 })],
  ])("plays nothing %s", (_when, state) => {
    const { playMove, chessRef } = setup(state);
    playMove("e2", "e4");
    expect(mocks.sendDuelMove).not.toHaveBeenCalled();
    expect(chessRef.current.history()).toEqual([]);
  });

  it("plays the server's reply after a moment", async () => {
    mocks.sendDuelMove.mockResolvedValue(moveResult());
    const { playMove } = setup(duel());
    playMove("e2", "e4");
    await vi.advanceTimersByTimeAsync(0);
    // Only the player's own move has sounded so far
    expect(mocks.playSoundForMove).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(mocks.playSoundForMove).toHaveBeenCalledTimes(2);
    expect(mocks.playSoundForMove.mock.calls[1]![0]).toMatchObject({ from: "e7", to: "e5" });
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("marks a solved puzzle on the square the move landed on", async () => {
    mocks.sendDuelMove.mockResolvedValue(moveResult({ outcome: "solved", reply: undefined, score: 3, nextPuzzle: puzzle({ index: 4 }) }));
    const { playMove } = setup(duel());
    playMove("g1", "f3");
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.cg.set.mock.calls.at(-1)![0].highlight.custom).toEqual(new Map([["f3", "duel-solved"]]));
    expect(mocks.getDuel).not.toHaveBeenCalled();
  });

  it("marks a miss, and after the strike that puts the player out asks whether the duel just ended", async () => {
    mocks.sendDuelMove.mockResolvedValue(moveResult({ outcome: "wrong", reply: undefined, strikes: 3, out: true }));
    const { playMove } = setup(duel());
    playMove("a2", "a3");
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.cg.set.mock.calls.at(-1)![0].highlight.custom).toEqual(new Map([["a3", "duel-missed"]]));
    expect(mocks.getDuel).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_300);
    expect(mocks.getDuel).toHaveBeenCalledWith(DUEL_ID);
  });
});

describe("a move the server never took", () => {
  // The fourth puzzle, two moves in: the next one is Nf3
  const midPuzzle = () => duel({ puzzle: puzzle({ played: ["e2e4", "e7e5"] }) });

  it("puts the board back to the puzzle as it stood, so the move can be played again", async () => {
    mocks.sendDuelMove.mockRejectedValue(new Error("Network Error"));
    const { playMove, chessRef } = setup(midPuzzle());
    const before = chessRef.current.fen();
    playMove("g1", "f3");
    expect(chessRef.current.history()).toEqual(["e4", "e5", "Nf3"]);
    await vi.advanceTimersByTimeAsync(0);
    // Not left on a move that wasn't played, with the other side to move
    expect(chessRef.current.fen()).toBe(before);
    expect(chessRef.current.history()).toEqual(["e4", "e5"]);
    expect(chessRef.current.turn()).toBe("w");
  });

  it("says so, and reads the duel again from the server", async () => {
    mocks.sendDuelMove.mockRejectedValue(new Error("Network Error"));
    const { playMove } = setup(midPuzzle());
    playMove("g1", "f3");
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.toastError).toHaveBeenCalledWith("Couldn't send your move.");
    expect(mocks.getDuel).toHaveBeenCalledWith(DUEL_ID);
  });

  it("gives the server's reason when it refused the move", async () => {
    mocks.sendDuelMove.mockRejectedValue(refused("That puzzle is over"));
    const { playMove } = setup(midPuzzle());
    playMove("g1", "f3");
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.toastError).toHaveBeenCalledWith("That puzzle is over");
  });
});

describe("the duel's state", () => {
  it("isn't kept once the page is left: coming back reads it again", () => {
    const { queryClient } = setup(duel());
    const query = queryClient.getQueryCache().find({ queryKey: [QKEY_DUEL, DUEL_ID] });
    expect(query?.options.gcTime).toBe(0);
  });

  it("is read again when the server says this duel has ended, and only then", () => {
    const { send, queryClient } = setup(duel());
    const invalidated = () => queryClient.getQueryState([QKEY_DUEL, DUEL_ID])?.isInvalidated;
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_ENDED, { duelId: 99, winnerId: 2, endReason: "time", scores: [] });
    expect(invalidated()).toBe(false);
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_ENDED, { duelId: DUEL_ID, winnerId: 2, endReason: "time", scores: [] });
    expect(invalidated()).toBe(true);
  });
});
