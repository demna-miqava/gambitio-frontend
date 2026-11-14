import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { isPlayerPly, moveSquares, otherLinePlaying } from "./drill";

const line = (id: number, moves: string, color: "white" | "black" = "white") => ({
  id,
  color,
  moves: moves.split(" "),
});

const fenAfter = (moves: string) => {
  const chess = new Chess();
  for (const san of moves.split(" ").filter(Boolean)) chess.move(san);
  return chess.fen();
};

describe("drill", () => {
  it("knows whose move each ply is", () => {
    expect(isPlayerPly("white", 0)).toBe(true);
    expect(isPlayerPly("white", 1)).toBe(false);
    expect(isPlayerPly("black", 1)).toBe(true);
  });

  it("recognises a move from another line of the same colour", () => {
    const italian = line(1, "e4 e5 Nf3 Nc6 Bc4");
    const spanish = line(2, "e4 e5 Nf3 Nc6 Bb5");
    const asBlack = line(3, "e4 e5 Nf3 Nc6 Bb5", "black");
    const lines = [italian, spanish, asBlack];
    const fen = fenAfter("e4 e5 Nf3 Nc6");
    expect(otherLinePlaying(lines, italian, fen, "Bb5")?.id).toBe(2);
    expect(otherLinePlaying(lines, italian, fen, "d4")).toBeNull();
  });

  it("finds it through a transposition", () => {
    const drilled = line(1, "d4 Nf6 c4 e6 Nc3");
    const other = line(2, "c4 e6 d4 Nf6 Nf3");
    expect(otherLinePlaying([drilled, other], drilled, fenAfter("d4 Nf6 c4 e6"), "Nf3")?.id).toBe(2);
  });

  it("gives the squares of a move", () => {
    expect(moveSquares(fenAfter(""), "Nf3")).toEqual({ from: "g1", to: "f3" });
    expect(moveSquares(fenAfter(""), "Nf6")).toBeNull();
  });
});
