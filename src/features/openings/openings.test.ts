import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import tableJson from "./data/openings.json?raw";
import { findOpening, type OpeningTable } from "./openings";

const table: OpeningTable = JSON.parse(tableJson);

const lineOf = (...moves: string[]) => {
  const chess = new Chess();
  const fens = [chess.fen()];
  for (const move of moves) {
    chess.move(move);
    fens.push(chess.fen());
  }
  return fens;
};

describe("findOpening", () => {
  it("has no name for the start position", () => {
    expect(findOpening(table, lineOf())).toBeNull();
  });

  it("names a line", () => {
    expect(findOpening(table, lineOf("e4", "c5"))).toEqual({
      eco: "B20",
      name: "Sicilian Defense",
    });
    expect(
      findOpening(table, lineOf("e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"))
    ).toEqual({ eco: "B90", name: "Sicilian Defense: Najdorf Variation" });
  });

  it("finds the name after a transposition", () => {
    // Queen's Gambit Declined reached by 1.c4 e6 2.Nc3 d5 3.d4
    const viaEnglish = findOpening(table, lineOf("c4", "e6", "Nc3", "d5", "d4"));
    const direct = findOpening(table, lineOf("d4", "d5", "c4", "e6", "Nc3"));
    expect(viaEnglish).toEqual(direct);
    expect(direct?.name).toMatch(/^Queen's Gambit Declined/);
  });

  it("keeps the last named position once the game leaves the book", () => {
    const outOfBook = lineOf("e4", "e5", "Nf3", "Nc6", "Bb5", "Ke7", "h3", "Kd6");
    expect(findOpening(table, outOfBook)).toEqual({ eco: "C60", name: "Ruy Lopez" });
  });
});
