import { describe, expect, it } from "vitest";
import {
  appendMove,
  isLineComplete,
  judgeLine,
  lineToSan,
  moveLabels,
  playerMoveCount,
} from "./calculateLine";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const LINE = ["e2e4", "e7e5", "g1f3"];
/** Two rooks: Rd8 and Re8 both mate */
const TWO_MATES = "6k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1";

const enter = (fen: string, length: number, moves: string[]) =>
  moves.reduce<string[]>((line, uci) => {
    const added = appendMove(fen, line, length, { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    if ("refused" in added) throw new Error(`${uci} refused: ${added.refused}`);
    return added.line;
  }, []);

describe("playerMoveCount", () => {
  it("counts the player's own moves (they move first and last)", () => {
    expect(playerMoveCount(["a"])).toBe(1);
    expect(playerMoveCount(["a", "b", "c"])).toBe(2);
    expect(playerMoveCount(["a", "b", "c", "d", "e"])).toBe(3);
  });
});

describe("appendMove", () => {
  it("follows the line on a hidden position, both sides' moves", () => {
    expect(enter(START, 3, LINE)).toEqual(LINE);
    const added = appendMove(START, ["e2e4"], 3, { from: "e7", to: "e5" });
    expect(added).toEqual({ line: ["e2e4", "e7e5"], san: "e5" });
  });

  it("refuses illegal moves, including a move for the wrong side", () => {
    expect(appendMove(START, [], 3, { from: "e2", to: "e5" })).toEqual({ refused: "illegal" });
    // Black's reply is due, so a white move is illegal
    expect(appendMove(START, ["e2e4"], 3, { from: "d2", to: "d4" })).toEqual({ refused: "illegal" });
    // A square that's empty in the hidden position
    expect(appendMove(START, ["e2e4", "e7e5"], 3, { from: "e2", to: "e3" })).toEqual({ refused: "illegal" });
  });

  it("allows no more moves than the solution has, and nothing after mate", () => {
    expect(appendMove(START, LINE, 3, { from: "b8", to: "c6" })).toEqual({ refused: "full" });
    expect(appendMove(TWO_MATES, ["d1d8"], 3, { from: "g8", to: "h8" })).toEqual({ refused: "over" });
  });

  it("keeps the promotion piece", () => {
    const fen = "8/4P1k1/8/8/8/8/6K1/8 w - - 0 1";
    expect(appendMove(fen, [], 1, { from: "e7", to: "e8", promotion: "n" })).toEqual({
      line: ["e7e8n"],
      san: "e8=N+",
    });
  });
});

describe("isLineComplete", () => {
  it("needs the player's last move", () => {
    expect(isLineComplete(START, [], 3)).toBe(false);
    expect(isLineComplete(START, ["e2e4"], 3)).toBe(false);
    expect(isLineComplete(START, ["e2e4", "e7e5"], 3)).toBe(false);
    expect(isLineComplete(START, LINE, 3)).toBe(true);
  });

  it("is complete early when a move of the player's mates", () => {
    expect(isLineComplete(TWO_MATES, ["e1e8"], 3)).toBe(true);
    expect(isLineComplete(TWO_MATES, ["e1e7"], 3)).toBe(false);
  });
});

describe("judgeLine", () => {
  it("solves when every move matches", () => {
    expect(judgeLine(START, LINE, LINE)).toEqual({ result: "solved" });
  });

  it("fails on the first wrong move of the player's", () => {
    expect(judgeLine(START, LINE, ["d2d4", "d7d5", "c2c4"])).toEqual({ result: "failed", index: 0 });
    expect(judgeLine(START, LINE, ["e2e4", "e7e5", "b1c3"])).toEqual({ result: "failed", index: 2 });
  });

  it("a different predicted reply after right moves is no miss", () => {
    expect(judgeLine(START, LINE, ["e2e4", "c7c5", "g1f3"])).toEqual({ result: "reply-differs", index: 1 });
  });

  it("judges the rest of a line entered after the real reply was played", () => {
    // e4 c5 was fixed as e4 e5: the moves entered after it decide
    const long = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"];
    expect(judgeLine(START, long, ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"])).toEqual({ result: "solved" });
    expect(judgeLine(START, long, ["e2e4", "e7e5", "f1c4", "b8c6", "c4b5"])).toEqual({ result: "failed", index: 2 });
    expect(judgeLine(START, long, ["e2e4", "e7e5", "g1f3", "g8f6", "f1b5"])).toEqual({
      result: "reply-differs",
      index: 3,
    });
    // Only the player's move after the fixed start ends the line
    expect(isLineComplete(START, ["e2e4", "e7e5", "g1f3"], 5)).toBe(false);
    expect(isLineComplete(START, ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"], 5)).toBe(true);
  });

  it("a wrong move before a different reply is still a miss", () => {
    expect(judgeLine(START, LINE, ["d2d4", "c7c5", "d4d5"])).toEqual({ result: "failed", index: 0 });
  });

  it("counts a final move that mates, even if it isn't the listed one", () => {
    expect(judgeLine(TWO_MATES, ["d1d8"], ["e1e8"])).toEqual({ result: "solved" });
    expect(judgeLine(TWO_MATES, ["d1d8"], ["e1e7"])).toEqual({ result: "failed", index: 0 });
  });

  it("compares the promotion piece", () => {
    const fen = "8/4P1k1/8/8/8/8/6K1/8 w - - 0 1";
    expect(judgeLine(fen, ["e7e8n"], ["e7e8q"])).toEqual({ result: "failed", index: 0 });
    expect(judgeLine(fen, ["e7e8n"], ["e7e8n"])).toEqual({ result: "solved" });
  });
});

describe("lineToSan and moveLabels", () => {
  it("writes the line in SAN", () => {
    expect(lineToSan(START, LINE)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("numbers moves from the FEN, black to move first", () => {
    expect(moveLabels(START, 3)).toEqual(["1.", "1...", "2."]);
    expect(moveLabels("3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 24", 3)).toEqual(["24...", "25.", "25..."]);
  });
});
