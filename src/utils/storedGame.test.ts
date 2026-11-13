import { describe, expect, it } from "vitest";
import type { StoredGame } from "@/types";
import { isBotGame, isBotPlayer, isPlayerGame } from "./storedGame";

const player = (id: number | null) => ({ id, username: "x", rating: 1200, avatarUrl: null, ratingChange: null });
const base: StoredGame = {
  id: 1,
  createdAt: new Date("2026-11-13"),
  pgn: "",
  fen: null,
  winnerId: null,
  numMoves: 2,
  time: 300,
  increment: 0,
  type: "blitz",
  status: "finished",
  result: "draw",
  endReason: "stalemate",
  rated: true,
  botId: null,
  whitePlayer: player(1),
  blackPlayer: player(2),
};
const botGame: StoredGame = {
  ...base,
  botId: "club-bot",
  rated: false,
  time: null,
  type: null,
  blackPlayer: player(null),
};

describe("stored game helpers", () => {
  it("tells bot games from games between players", () => {
    expect(isBotGame(base)).toBe(false);
    expect(isPlayerGame(base)).toBe(true);
    expect(isBotGame(botGame)).toBe(true);
    expect(isPlayerGame(botGame)).toBe(false);
  });

  it("finds the bot's side", () => {
    expect(isBotPlayer(botGame, botGame.blackPlayer)).toBe(true);
    expect(isBotPlayer(botGame, botGame.whitePlayer)).toBe(false);
    expect(isBotPlayer(base, base.whitePlayer)).toBe(false);
  });
});
