import { describe, expect, it } from "vitest";
import { formatSolutionLine } from "./solutionLine";

describe("formatSolutionLine", () => {
  it("numbers a line that starts with White", () => {
    const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4";
    expect(formatSolutionLine(fen, ["h5f7"])).toEqual([{ moveNumber: "4.", san: "Qxf7#" }]);
  });

  it("numbers a line that starts with Black, then each White move", () => {
    // 1.e4 e5 2.Nf3, Black to move
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
    expect(formatSolutionLine(fen, ["b8c6", "f1b5", "a7a6"])).toEqual([
      { moveNumber: "2…", san: "Nc6" },
      { moveNumber: "3.", san: "Bb5" },
      { san: "a6" },
    ]);
  });

  it("keeps promotions and stops at a move that doesn't apply", () => {
    const fen = "8/P7/8/8/8/8/8/k6K w - - 0 1";
    expect(formatSolutionLine(fen, ["a7a8n", "a1b1", "h1h3"])).toEqual([
      { moveNumber: "1.", san: "a8=N" },
      { san: "Kb1" },
    ]);
  });

  it("returns nothing for a bad FEN", () => {
    expect(formatSolutionLine("not a fen", ["e2e4"])).toEqual([]);
  });
});
