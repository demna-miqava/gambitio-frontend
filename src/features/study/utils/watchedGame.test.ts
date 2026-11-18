import { describe, expect, it } from "vitest";
import type { GameWebSocketMessage, InitialGameStateMessage } from "@/features/game/types/websocket-messages";
import { applyWatchedGameMessage, describeWatchedResult } from "./watchedGame";

const player = (id: number, username: string) => ({ id, username, rating: 1500, avatarUrl: null });
const initial = (overrides: Partial<InitialGameStateMessage["data"]> = {}) =>
  ({
    type: "initial_game_state",
    data: {
      gameId: 7,
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
      pgn: "1. e4 e5",
      whitePlayer: player(1, "whitey"),
      blackPlayer: player(2, "blacky"),
      time: 300,
      increment: 2,
      status: "in_progress",
      numMoves: 2,
      isFinished: false,
      clockRunning: true,
      whiteTimeLeft: 290_000,
      blackTimeLeft: 295_000,
      drawOfferedBy: null,
      rematchRequestedBy: null,
      ...overrides,
    },
  }) as GameWebSocketMessage;

describe("applyWatchedGameMessage", () => {
  it("reads the game's state, with its last move", () => {
    const { game, changed } = applyWatchedGameMessage(null, initial());
    expect(changed).toBe(true);
    expect(game?.lastMove).toEqual({ san: "e5", from: "e7", to: "e5" });
    expect(game?.ply).toBe(2);
    expect(game?.inProgress).toBe(true);
    expect(applyWatchedGameMessage(null, initial({ pgn: "", numMoves: 0 })).game?.lastMove).toBeNull();
  });

  it("follows moves, takebacks and the end, and says when the room should catch up", () => {
    let { game } = applyWatchedGameMessage(null, initial());
    const moved = applyWatchedGameMessage(game, {
      type: "move",
      move: { lan: "g1f3", san: "Nf3", from: "g1", to: "f3" },
      userId: 1,
      fen: "after-nf3",
      moveNumber: 3,
      clockRunning: true,
      whiteTimeLeft: 288_000,
      blackTimeLeft: 295_000,
    } as GameWebSocketMessage);
    expect(moved.changed).toBe(true);
    expect(moved.game?.lastMove?.san).toBe("Nf3");
    expect(moved.game?.whiteTimeLeft).toBe(288_000);
    game = moved.game;

    const back = applyWatchedGameMessage(game, {
      type: "takeback",
      fen: "x",
      pgn: "1. e4",
      moveNumber: 1,
      clockRunning: true,
      whiteTimeLeft: 1,
      blackTimeLeft: 2,
    } as GameWebSocketMessage);
    expect(back.changed).toBe(true);
    expect(back.game?.lastMove?.san).toBe("e4");
    expect(back.game?.ply).toBe(1);

    const time = applyWatchedGameMessage(back.game, {
      type: "time_added",
      userId: 1,
      color: "black",
      addedMs: 15_000,
      whiteTimeLeft: 1,
      blackTimeLeft: 15_002,
    } as GameWebSocketMessage);
    expect(time.changed).toBe(false);
    expect(time.game?.blackTimeLeft).toBe(15_002);

    const over = applyWatchedGameMessage(time.game, {
      type: "game_ended",
      reason: "checkmate",
      result: "white_win",
      winnerId: 1,
    } as GameWebSocketMessage);
    expect(over.changed).toBe(true);
    expect(over.game?.inProgress).toBe(false);
    expect(describeWatchedResult(over.game!)).toBe("whitey won by checkmate");
  });

  it("ignores what isn't about the game, and moves before the state", () => {
    const { game } = applyWatchedGameMessage(null, initial());
    const spectators = applyWatchedGameMessage(game, { type: "spectators", count: 3 } as GameWebSocketMessage);
    expect(spectators).toEqual({ game, changed: false });
    expect(
      applyWatchedGameMessage(null, { type: "game_ended", reason: "resignation", result: "draw", winnerId: null } as GameWebSocketMessage)
    ).toEqual({ game: null, changed: false });
  });

  it("describes results", () => {
    const base = { white: player(1, "a"), black: player(2, "b") };
    expect(describeWatchedResult({ ...base, result: "draw", reason: "threefold_repetition" })).toBe("Draw by repetition");
    expect(describeWatchedResult({ ...base, result: "black_win", reason: "timeout" })).toBe("b won on time");
    expect(describeWatchedResult({ ...base, result: "draw", reason: "insufficient_material" })).toBe("Draw (insufficient material)");
    expect(describeWatchedResult({ ...base, result: "aborted", reason: "aborted" })).toBe("Game aborted");
  });
});
