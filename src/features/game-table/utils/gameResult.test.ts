import { describe, expect, it } from "vitest";
import type { StoredGame } from "@/types";
import { getResult } from "./gameResult";

const player = (id: number | null, username: string) => ({
  id,
  username,
  rating: 1200,
  avatarUrl: null,
  ratingChange: null,
});

const game = (overrides: Partial<StoredGame>): StoredGame => ({
  id: 1,
  createdAt: new Date("2026-11-13"),
  pgn: "",
  fen: null,
  winnerId: null,
  numMoves: 4,
  time: 180,
  increment: 0,
  type: "blitz",
  status: "finished",
  result: "draw",
  endReason: "stalemate",
  rated: true,
  botId: null,
  whitePlayer: player(1, "ann"),
  blackPlayer: player(2, "bob"),
  ...overrides,
});

describe("getResult", () => {
  it("reads the result from the player's side", () => {
    const whiteWin = game({ result: "white_win", winnerId: 1 });
    expect(getResult(whiteWin, 1)).toBe("win");
    expect(getResult(whiteWin, 2)).toBe("loss");
    expect(getResult(game({ result: "draw" }), 1)).toBe("draw");
  });

  it("counts a bot's win as a loss even though it has no winnerId", () => {
    const botGame = game({
      botId: "casual-bot",
      rated: false,
      time: null,
      type: null,
      whitePlayer: player(null, "Casual Carl"),
      blackPlayer: player(2, "bob"),
      result: "white_win",
      winnerId: null,
    });
    expect(getResult(botGame, 2)).toBe("loss");
    expect(getResult({ ...botGame, result: "black_win", winnerId: 2 }, 2)).toBe("win");
  });

  it("is neutral for people who didn't play and without a user", () => {
    const whiteWin = game({ result: "white_win", winnerId: 1 });
    expect(getResult(whiteWin, 3)).toBe("draw");
    expect(getResult(whiteWin)).toBe("draw");
  });

  it("falls back to winnerId for rows without a result", () => {
    expect(getResult(game({ result: null, winnerId: 2 }), 2)).toBe("win");
    expect(getResult(game({ result: null, winnerId: 2 }), 1)).toBe("loss");
  });
});
