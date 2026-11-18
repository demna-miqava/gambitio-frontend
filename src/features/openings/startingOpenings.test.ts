import { describe, expect, it } from "vitest";
import { formatOpeningMoves, groupStartingOpenings, type StartingOpening } from "./startingOpenings";

const opening = (id: string, moves: string[]): StartingOpening => ({ id, eco: "A00", name: id, moves, fen: "" });

describe("starting openings", () => {
  it("numbers the moves", () => {
    expect(formatOpeningMoves(["d4", "d5", "c4"])).toBe("1. d4 d5 2. c4");
    expect(formatOpeningMoves(["c4"])).toBe("1. c4");
  });

  it("groups by first move, keeping the order", () => {
    const groups = groupStartingOpenings([
      opening("italian", ["e4", "e5"]),
      opening("qg", ["d4", "d5", "c4"]),
      opening("sicilian", ["e4", "c5"]),
      opening("english", ["c4"]),
    ]);
    expect(groups.map((g) => [g.label, g.openings.map((o) => o.id)])).toEqual([
      ["1. e4", ["italian", "sicilian"]],
      ["1. d4", ["qg"]],
      ["Flank openings", ["english"]],
    ]);
  });
});
