import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { buildBotGamePgn } from "./botGamePgn";

const moves = ["f3", "e5", "g4", "Qh4#"].map((san) => ({ san }));
const date = new Date("2026-11-13T10:00:00Z");

describe("buildBotGamePgn", () => {
  it("names the players by colour and records the result from the player's side", () => {
    const pgn = buildBotGamePgn({
      moves,
      playerColor: "white",
      playerName: "ann",
      botName: "Casual Carl",
      result: { outcome: "loss", reason: "by checkmate" },
      date,
    });
    const chess = new Chess();
    chess.loadPgn(pgn);
    expect(chess.getHeaders()).toMatchObject({
      White: "ann",
      Black: "Casual Carl",
      Result: "0-1",
      Date: "2026.11.13",
    });
    expect(chess.history()).toEqual(["f3", "e5", "g4", "Qh4#"]);
    expect(chess.isCheckmate()).toBe(true);
  });

  it("handles black wins, draws and resignations", () => {
    const base = { moves: moves.slice(0, 2), playerName: "ann", botName: "Bot", date };
    const result = (pgn: string) => {
      const chess = new Chess();
      chess.loadPgn(pgn);
      return chess.getHeaders().Result;
    };
    expect(
      result(buildBotGamePgn({ ...base, playerColor: "black", result: { outcome: "win", reason: "by resignation" } }))
    ).toBe("0-1");
    expect(
      result(buildBotGamePgn({ ...base, playerColor: "black", result: { outcome: "loss", reason: "by resignation" } }))
    ).toBe("1-0");
    expect(
      result(buildBotGamePgn({ ...base, playerColor: "white", result: { outcome: "draw", reason: "by stalemate" } }))
    ).toBe("1/2-1/2");
  });
});
