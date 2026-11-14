import { describe, expect, test } from "vitest";
import { DEFAULT_POSITION } from "chess.js";
import { capFrames, gameFrames, piecesFromFen } from "./frames";

const GAME = `[Event "Gambitio game"]
[White "alice"]
[Black "bob"]
[Result "1-0"]

1. e4 {best by test} e5 (1... c5 2. Nf3) 2. Qh5 Nc6 3. Bc4 Nf6?? 4. Qxf7# 1-0`;

describe("frames from a PGN", () => {
  test("one frame per ply, starting with the start position", () => {
    const frames = gameFrames(GAME);
    expect(frames).toHaveLength(8);
    expect(frames[0]).toEqual({ fen: DEFAULT_POSITION, lastMove: null, ply: 0 });
    expect(frames.map((f) => f.ply)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  test("each frame has the squares of the move that led to it", () => {
    const frames = gameFrames(GAME);
    expect(frames[1]!.lastMove).toEqual(["e2", "e4"]);
    expect(frames[2]!.lastMove).toEqual(["e7", "e5"]);
    expect(frames[7]!.lastMove).toEqual(["h5", "f7"]);
    expect(frames[7]!.fen.startsWith("r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b")).toBe(true);
  });

  test("variations and comments are skipped", () => {
    const sans = gameFrames(GAME).slice(1).map((f) => f.lastMove!.join("-"));
    expect(sans).not.toContain("c7-c5");
  });

  test("castling highlights the king's squares", () => {
    const frames = gameFrames("1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O");
    expect(frames.at(-1)!.lastMove).toEqual(["e1", "g1"]);
  });

  test("a FEN header sets the first frame", () => {
    const fen = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
    const frames = gameFrames(`[SetUp "1"]\n[FEN "${fen}"]\n\n1. e4 Kd7 *`);
    expect(frames[0]!.fen).toBe(fen);
    expect(frames).toHaveLength(3);
  });

  test("a game without moves is just the start", () => {
    expect(gameFrames("")).toEqual([{ fen: DEFAULT_POSITION, lastMove: null, ply: 0 }]);
  });

  test("an illegal move throws", () => {
    expect(() => gameFrames("1. e4 e4")).toThrow();
  });
});

describe("capping long games", () => {
  test("short games are untouched", () => {
    const frames = [1, 2, 3];
    expect(capFrames(frames, 5)).toBe(frames);
  });

  test("keeps the start and the end, evenly spread, without repeats", () => {
    const frames = Array.from({ length: 501 }, (_, i) => i);
    const capped = capFrames(frames, 240);
    expect(capped).toHaveLength(240);
    expect(capped[0]).toBe(0);
    expect(capped.at(-1)).toBe(500);
    expect(new Set(capped).size).toBe(240);
    expect(capped).toEqual([...capped].sort((a, b) => a - b));
  });
});

describe("pieces from a FEN", () => {
  test("reads squares, colors and types", () => {
    const pieces = piecesFromFen(DEFAULT_POSITION);
    expect(pieces).toHaveLength(32);
    expect(pieces).toContainEqual({ square: "e1", color: "w", type: "k" });
    expect(pieces).toContainEqual({ square: "d8", color: "b", type: "q" });
    expect(pieces).toContainEqual({ square: "a2", color: "w", type: "p" });
    expect(pieces).toContainEqual({ square: "h8", color: "b", type: "r" });
  });

  test("handles empty runs", () => {
    expect(piecesFromFen("8/8/8/3k4/8/8/8/7K w - - 0 1")).toEqual([
      { square: "d5", color: "b", type: "k" },
      { square: "h1", color: "w", type: "k" },
    ]);
  });
});
