import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Chess } from "chess.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { errorMayHaveDroppedMove, gameErrorText, useLiveGameMessages } from "./useLiveGameMessages";

// The hook's message handlers, captured while it renders (subscribing is an
// effect, which server rendering doesn't run)
const handlers = new Map<string, (message: unknown) => void>();
const board = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/hooks/useMessageDispatcher", () => ({
  useMessageDispatcher: (_dispatcher: unknown, type: string, handler: (message: unknown) => void) => {
    handlers.set(type, handler);
  },
}));
vi.mock("@/features/game/contexts/ChessBoardContext", () => ({
  useChessBoardContext: () => board.current,
}));
vi.mock("@/features/game/contexts/GameNavigationContext", () => ({
  useGameNavigation: () => ({ goToLastMove: () => {} }),
}));
vi.mock("@/features/game/contexts/ChessSoundContext", () => ({
  useChessSound: () => ({ playSound: () => {}, playSoundForMove: () => {} }),
}));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1 }) }));
vi.mock("sonner", () => ({ toast: { error: () => {} } }));

/** The player (white, user 1) on a game whose moves so far are `localPgn` */
const setup = (localPgn: string) => {
  const chess = new Chess();
  chess.loadPgn(localPgn);
  const cg = { set: vi.fn(), playPremove: vi.fn(), cancelMove: vi.fn(), cancelPremove: vi.fn() };
  board.current = {
    chessRef: { current: chess },
    cgRef: { current: cg },
    color: "white",
    setTurn: () => [],
    inputLockedRef: { current: false },
    setInputLocked: () => {},
  };
  const requestSync = vi.fn();
  const onBoardReplaced = vi.fn();
  handlers.clear();
  const Harness = () => {
    useLiveGameMessages({
      setGameEnded: () => {},
      setRatingChanges: () => {},
      requestSync,
      onBoardReplaced,
      turnStartedAtRef: { current: null },
    });
    return null;
  };
  renderToStaticMarkup(createElement(Harness));
  const send = (type: string, message: object) => handlers.get(type)!({ type, ...message });
  return { chess, cg, requestSync, onBoardReplaced, send };
};

const initialState = (pgn: string) => ({
  data: { pgn, isFinished: false, clockRunning: true, whiteTimeLeft: 60_000, blackTimeLeft: 60_000 },
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resyncing from the server", () => {
  it("drops a premove instead of playing it when a refused move is rolled back", () => {
    // White's optimistic Nf3 (with a premove queued for after Black's reply) is refused
    const { chess, cg, onBoardReplaced, send } = setup("1. e4 e5 2. Nf3");
    send(GAME_MESSAGE_TYPES.MOVE_REJECTED, { message: "Illegal move", fen: "", pgn: "1. e4 e5" });
    expect(chess.history()).toEqual(["e4", "e5"]);
    expect(cg.playPremove).not.toHaveBeenCalled();
    expect(cg.cancelMove).toHaveBeenCalled();
    // A promotion picker belonged to the old board
    expect(onBoardReplaced).toHaveBeenCalled();
  });

  it("drops a premove when a resync after an error rolls the position back", () => {
    const { cg, send } = setup("1. e4 e5 2. Nf3");
    send(GAME_MESSAGE_TYPES.INITIAL_GAME_STATE, initialState("1. e4 e5"));
    expect(cg.playPremove).not.toHaveBeenCalled();
    expect(cg.cancelMove).toHaveBeenCalled();
  });

  it("keeps a premove when the server's position is the one on the board", () => {
    const { cg, send } = setup("1. e4");
    send(GAME_MESSAGE_TYPES.INITIAL_GAME_STATE, initialState("1. e4"));
    expect(cg.playPremove).not.toHaveBeenCalled();
    expect(cg.cancelMove).not.toHaveBeenCalled();
  });

  it("drops a pending error resync once the full state has arrived", () => {
    vi.useFakeTimers();
    const rateLimited = { data: { message: "Too many messages", code: "RATE_LIMITED", request: { type: "move" } } };
    const first = setup("1. e4");
    first.send(GAME_MESSAGE_TYPES.ERROR, rateLimited);
    vi.advanceTimersByTime(1_000);
    expect(first.requestSync).toHaveBeenCalledTimes(1);

    const { requestSync, send } = setup("1. e4");
    send(GAME_MESSAGE_TYPES.ERROR, rateLimited);
    send(GAME_MESSAGE_TYPES.INITIAL_GAME_STATE, initialState("1. e4"));
    vi.advanceTimersByTime(1_000);
    expect(requestSync).not.toHaveBeenCalled();
  });
});

describe("errorMayHaveDroppedMove", () => {
  it("resyncs after an error about a move", () => {
    expect(
      errorMayHaveDroppedMove({
        message: "The game is over",
        code: "GAME_OVER",
        request: { type: "move", move: { from: "e2", to: "e4" } },
      } as never)
    ).toBe(true);
  });

  it("resyncs after a rate limit, which names no request", () => {
    expect(errorMayHaveDroppedMove({ message: "Too many messages", code: "RATE_LIMITED" })).toBe(true);
  });

  it("doesn't resync after errors for other actions, or for a sync", () => {
    expect(
      errorMayHaveDroppedMove({ message: "No draw offer", request: { type: "draw_response" } } as never)
    ).toBe(false);
    expect(errorMayHaveDroppedMove({ message: "Failed", request: { type: "sync" } } as never)).toBe(false);
    expect(
      errorMayHaveDroppedMove({ message: "Declined", request: { type: "takeback_request" } } as never)
    ).toBe(false);
  });
});

describe("gameErrorText", () => {
  it("names a dropped action so the player sends it again", () => {
    expect(gameErrorText({ message: "Too many messages", code: "RATE_LIMITED", request: { type: "resign" } })).toBe(
      "Too many messages: your resignation wasn't sent. Try again."
    );
    expect(gameErrorText({ message: "Too many messages", code: "RATE_LIMITED", request: { type: "move" } })).toBe(
      "Too many messages"
    );
    expect(
      gameErrorText({ message: "Too many messages", code: "RATE_LIMITED", request: { type: "takeback_request" } })
    ).toBe("Too many messages: your takeback request wasn't sent. Try again.");
    expect(gameErrorText({ message: "No draw offer", code: "NO_OFFER", request: { type: "draw_response" } })).toBe(
      "No draw offer"
    );
  });
});
