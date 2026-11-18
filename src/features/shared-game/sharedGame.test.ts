import { describe, expect, it } from "vitest";
import { Chess, DEFAULT_POSITION } from "chess.js";
import type { StoredGame } from "@/types";
import { outcomeText, parseShareToken, replayGame, scoreText, sharedGamePgn, sharedGameUrl } from "./sharedGame";

const game = {
  id: 7,
  createdAt: new Date("2026-11-18T10:00:00Z"),
  pgn: "1. f3 e5 2. g4 Qh4# 0-1",
  fen: null,
  winnerId: 2,
  numMoves: 4,
  time: 180,
  increment: 2,
  type: "blitz",
  status: "finished",
  result: "black_win",
  endReason: "checkmate",
  rated: true,
  botId: null,
  whitePlayer: { id: 1, username: "alice", rating: 1500, avatarUrl: null, ratingChange: -7 },
  blackPlayer: { id: 2, username: "bob", rating: 1490, avatarUrl: null, ratingChange: 7 },
} as StoredGame;

describe("parseShareToken", () => {
  it("accepts only what the server hands out", () => {
    expect(parseShareToken("aB3dE6gH9jK2mN")).toBe("aB3dE6gH9jK2mN");
    for (const bad of [undefined, "", "short", "aB3dE6gH9jK2mNx", "aB3dE6gH9jK2m-", "../api/users/1", "aB3dE6gH9jK2m "]) {
      expect(parseShareToken(bad)).toBeNull();
    }
  });
});

describe("sharedGameUrl", () => {
  it("is the public page on this site", () => {
    expect(sharedGameUrl("aB3dE6gH9jK2mN", "https://gambitio.example")).toBe(
      "https://gambitio.example/share/aB3dE6gH9jK2mN"
    );
  });
});

describe("replayGame", () => {
  it("gives every position from the start to the last move", () => {
    const { moves, fens } = replayGame(game.pgn);
    expect(moves.map((move) => move.san)).toEqual(["f3", "e5", "g4", "Qh4#"]);
    expect(fens).toHaveLength(5);
    expect(fens[0]).toBe(DEFAULT_POSITION);
    expect(new Chess(fens[4]).isCheckmate()).toBe(true);
  });

  it("falls back to the start position for no moves or a broken PGN", () => {
    for (const pgn of [null, undefined, "", "1. e4 e4 e4", "not a game"]) {
      expect(replayGame(pgn)).toEqual({ moves: [], fens: [DEFAULT_POSITION] });
    }
  });
});

describe("outcomeText", () => {
  it("says who won and how", () => {
    expect(outcomeText(game)).toBe("bob won by checkmate");
    expect(outcomeText({ ...game, result: "white_win", endReason: "timeout" })).toBe("alice won on time");
    expect(outcomeText({ ...game, result: "draw", endReason: "threefold_repetition" })).toBe("Draw by repetition");
    // A reason this page doesn't know is left out rather than shown raw
    expect(outcomeText({ ...game, result: "draw", endReason: "some_new_reason" })).toBe("Draw");
    expect(outcomeText({ ...game, result: null, endReason: null })).toBe("Game over");
  });
});

describe("scoreText", () => {
  it("is the score line", () => {
    expect([scoreText("white_win"), scoreText("black_win"), scoreText("draw"), scoreText(null)]).toEqual([
      "1-0",
      "0-1",
      "½-½",
      "",
    ]);
  });
});

describe("sharedGamePgn", () => {
  it("is a PGN another site can import", () => {
    const { moves } = replayGame(game.pgn);
    const pgn = sharedGamePgn(game, moves);
    expect(pgn).toContain('[White "alice"]');
    expect(pgn).toContain('[Date "2026.11.18"]');
    expect(pgn).toContain('[TimeControl "180+2"]');
    expect(pgn.trimEnd().endsWith("1. f3 e5 2. g4 Qh4# 0-1")).toBe(true);
    const loaded = new Chess();
    loaded.loadPgn(pgn);
    expect(loaded.history()).toEqual(["f3", "e5", "g4", "Qh4#"]);
    expect(loaded.header().Black).toBe("bob");
  });

  it("escapes a quote or backslash in a name, as the PGN standard asks", () => {
    const odd = { ...game, whitePlayer: { ...game.whitePlayer, username: 'al"ice\\' } };
    const pgn = sharedGamePgn(odd, replayGame(game.pgn).moves);
    expect(pgn).toContain('[White "al\\"ice\\\\"]');
    // The header still ends where it should: the next one starts on its own line
    expect(pgn).toContain('\n[Black "bob"]\n');
  });

  it("leaves the clock out of a bot game, which has none", () => {
    expect(sharedGamePgn({ ...game, time: null, type: null }, [])).not.toContain("TimeControl");
  });
});
