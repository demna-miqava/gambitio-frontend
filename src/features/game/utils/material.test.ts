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
      white: { captured: {}, advantage: 0 },
      black: { captured: {}, advantage: 0 },
    });
  });

  it("lists what each side took and who is ahead", () => {
    // White wins a knight, black a pawn: white +2
    const chess = play("e4", "Nf6", "d3", "Nxe4", "dxe4");
    expect(getMaterial(chess.fen())).toEqual({
      white: { captured: { n: 1 }, advantage: 2 },
      black: { captured: { p: 1 }, advantage: 0 },
    });
  });

  it("shows trades on both sides with no lead", () => {
    const chess = play("e4", "d5", "exd5", "Qxd5");
    expect(getMaterial(chess.fen())).toEqual({
      white: { captured: { p: 1 }, advantage: 0 },
      black: { captured: { p: 1 }, advantage: 0 },
    });
  });

  it("doesn't count a promoted pawn as captured", () => {
    // White: K, 2 queens (one promoted), 7 pawns, nothing else lost besides
    // the minor and major pieces missing below. Black: king only.
    const fen = "Q3k3/8/8/8/8/8/PPPPPPP1/RNBQKBNR b KQ - 0 1";
    const { white, black } = getMaterial(fen);
    expect(black.captured).toEqual({});
    expect(white.captured).toEqual({ p: 8, n: 2, b: 2, r: 2, q: 1 });
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
