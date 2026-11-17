import { describe, expect, it } from "vitest";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { getMaterial, positionsAlong } from "./material";

const play = (...moves: string[]) => {
  const chess = new Chess();
  for (const move of moves) chess.move(move);
  return chess;
};

describe("getMaterial", () => {
  it("is level with nothing captured at the start", () => {
    expect(getMaterial(DEFAULT_POSITION)).toEqual({
      white: { pieces: {}, advantage: 0 },
      black: { pieces: {}, advantage: 0 },
    });
  });

  it("shows the pieces each side is up and who is ahead", () => {
    // White wins a knight, black a pawn: white +2
    const chess = play("e4", "Nf6", "d3", "Nxe4", "dxe4");
    expect(getMaterial(chess.fen())).toEqual({
      white: { pieces: { n: 1 }, advantage: 2 },
      black: { pieces: { p: 1 }, advantage: 0 },
    });
  });

  it("cancels out trades", () => {
    const chess = play("e4", "d5", "exd5", "Qxd5");
    expect(getMaterial(chess.fen())).toEqual({
      white: { pieces: {}, advantage: 0 },
      black: { pieces: {}, advantage: 0 },
    });
  });

  it("keeps only the difference when both sides took the same kind", () => {
    // White has taken 3 pawns and a knight, black 1 pawn and a knight
    const fen = "r1bqkbnr/ppppp3/8/8/8/8/PPPPPPP1/R1BQKBNR w KQkq - 0 1";
    expect(getMaterial(fen)).toEqual({
      white: { pieces: { p: 2 }, advantage: 2 },
      black: { pieces: {}, advantage: 0 },
    });
  });

  it("counts a promoted pawn as a piece of its new kind", () => {
    // White: K, 2 queens (one promoted), 7 pawns and the rest. Black: king only.
    const fen = "Q3k3/8/8/8/8/8/PPPPPPP1/RNBQKBNR b KQ - 0 1";
    const { white, black } = getMaterial(fen);
    expect(black.pieces).toEqual({});
    expect(white.pieces).toEqual({ p: 7, n: 2, b: 2, r: 2, q: 2 });
    expect(white.advantage).toBe(7 + 6 + 6 + 10 + 18);
  });
});

describe("positionsAlong", () => {
  it("returns the start and the position after each shown move", () => {
    const chess = play("e4", "e5", "Nf3");
    const moves = chess.history({ verbose: true });
    const line = positionsAlong(moves, 2);
    expect(line).toHaveLength(3);
    expect(line[0]).toBe(DEFAULT_POSITION);
    expect(line[2]).toBe(moves[1].after);
    expect(positionsAlong(moves).at(-1)).toBe(chess.fen());
  });

  it("is just the start position without moves", () => {
    expect(positionsAlong([])).toEqual([DEFAULT_POSITION]);
  });
});
