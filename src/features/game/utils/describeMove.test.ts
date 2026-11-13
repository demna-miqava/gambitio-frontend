import { describe, expect, it } from "vitest";
import { describeMove } from "./describeMove";

describe("describeMove", () => {
  it("spells out piece moves and captures", () => {
    expect(describeMove("Nf3")).toBe("Knight to f3");
    expect(describeMove("Bxc6")).toBe("Bishop takes c6");
    expect(describeMove("Qh5+")).toBe("Queen to h5, check");
    expect(describeMove("Rxe8#")).toBe("Rook takes e8, checkmate");
  });

  it("handles pawns, including captures and promotion", () => {
    expect(describeMove("e4")).toBe("Pawn to e4");
    expect(describeMove("exd5")).toBe("Pawn on e takes d5");
    expect(describeMove("e8=Q")).toBe("Pawn to e8 promotes to queen");
    expect(describeMove("bxa1=N+")).toBe("Pawn on b takes a1 promotes to knight, check");
  });

  it("keeps disambiguation", () => {
    expect(describeMove("Nbd7")).toBe("Knight from b to d7");
    expect(describeMove("R1e2")).toBe("Rook from 1 to e2");
  });

  it("handles castling", () => {
    expect(describeMove("O-O")).toBe("Short castle");
    expect(describeMove("O-O-O+")).toBe("Long castle, check");
  });

  it("falls back to the SAN", () => {
    expect(describeMove("--")).toBe("--");
  });
});
