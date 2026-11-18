import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { loadServerPgn } from "./loadServerPgn";

/** A game with these moves played */
function played(sans: string[]) {
  const chess = new Chess();
  for (const san of sans) chess.move(san);
  return chess;
}

const sans = (chess: Chess) => chess.history();

describe("loadServerPgn", () => {
  it("replaces the game with the server's, keeping its moves", () => {
    const chess = played(["d4", "d5"]);
    const server = played(["e4", "e5", "Nf3"]);
    expect(loadServerPgn(chess, server.pgn())).toBe(true);
    expect(sans(chess)).toEqual(["e4", "e5", "Nf3"]);
    expect(chess.fen()).toBe(server.fen());
  });

  it("resets the game for an empty PGN (no moves yet)", () => {
    const chess = played(["e4"]);
    expect(loadServerPgn(chess, "")).toBe(true);
    expect(sans(chess)).toEqual([]);
    expect(chess.fen()).toBe(new Chess().fen());
  });

  it("leaves the game untouched when a move in the PGN is illegal", () => {
    // loadPgn alone would have reset the game and played 1. e4 e5 first
    const chess = played(["d4", "d5", "c4"]);
    const fen = chess.fen();
    expect(loadServerPgn(chess, "1. e4 e5 2. Ke3")).toBe(false);
    expect(sans(chess)).toEqual(["d4", "d5", "c4"]);
    expect(chess.fen()).toBe(fen);
  });

  it("leaves the game untouched when the PGN doesn't parse", () => {
    const chess = played(["e4"]);
    const fen = chess.fen();
    expect(loadServerPgn(chess, "1. e4 {unclosed")).toBe(false);
    expect(sans(chess)).toEqual(["e4"]);
    expect(chess.fen()).toBe(fen);
  });

  it("confirms plain loadPgn is not all or nothing (why this exists)", () => {
    const chess = played(["d4"]);
    expect(() => chess.loadPgn("1. e4 e5 2. Ke3")).toThrow();
    expect(sans(chess)).toEqual(["e4", "e5"]);
  });
});
