import { describe, expect, it } from "vitest";
import { groupMovesIntoPairs, startPlyOfFen } from "./moveListUtils";

describe("move pairs from a set-up position", () => {
  it("pairs from the initial position as before", () => {
    expect(groupMovesIntoPairs(["e4", "e5", "Nf3"])).toEqual([
      { moveNumber: 1, white: "e4", black: "e5" },
      { moveNumber: 2, white: "Nf3", black: null },
    ]);
  });

  it("numbers from the starting ply, with black's move alone when black starts", () => {
    expect(groupMovesIntoPairs(["Bxf7+", "Ke7"], 10)).toEqual([{ moveNumber: 6, white: "Bxf7+", black: "Ke7" }]);
    expect(groupMovesIntoPairs(["Ke7", "Nd5#"], 11)).toEqual([
      { moveNumber: 6, white: null, black: "Ke7" },
      { moveNumber: 7, white: "Nd5#", black: null },
    ]);
  });

  it("reads the starting ply from a FEN", () => {
    expect(startPlyOfFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe(0);
    expect(startPlyOfFen("8/8/8/8/8/8/8/K6k b - - 0 6")).toBe(11);
    expect(startPlyOfFen("8/8/8/8/8/8/8/K6k w - -")).toBe(0);
  });
});
