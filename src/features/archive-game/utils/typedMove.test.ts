import { describe, expect, test } from "vitest";
import * as Tree from "./analysisTree";
import { planTypedMove } from "./typedMove";
import { boardLabel, positionAnnouncement, spokenMove } from "./announce";
import { parsePgn } from "./pgn";

const PROMOTION_FEN = "8/P7/8/8/8/8/8/k6K w - - 0 1";

describe("typed moves on an analysis board", () => {
  test("SAN and coordinates are played", () => {
    const root = Tree.createRoot();
    expect(planTypedMove(root, "Nf3")).toEqual({ kind: "play", from: "g1", to: "f3" });
    expect(planTypedMove(root, "e2e4")).toEqual({ kind: "play", from: "e2", to: "e4" });
  });

  test("illegal or unparseable input is an error", () => {
    const plan = planTypedMove(Tree.createRoot(), " Ke2 ");
    expect(plan).toEqual({ kind: "error", message: '"Ke2" isn\'t a legal move here.' });
  });

  test("a promotion with a piece is played with it", () => {
    const root = Tree.createRoot(PROMOTION_FEN);
    expect(planTypedMove(root, "a8=N")).toEqual({ kind: "play", from: "a7", to: "a8", promotion: "n" });
    expect(planTypedMove(root, "a7a8r")).toEqual({ kind: "play", from: "a7", to: "a8", promotion: "r" });
    expect(planTypedMove(root, "a8=Q+")).toEqual({ kind: "play", from: "a7", to: "a8", promotion: "q" });
  });

  test("a promotion without a piece asks, like a board move", () => {
    const root = Tree.createRoot(PROMOTION_FEN);
    expect(planTypedMove(root, "a7a8")).toEqual({ kind: "promote", from: "a7", to: "a8" });
  });
});

describe("analysis announcements", () => {
  const { root } = parsePgn("1. e4 e5 2. Nf3");
  const e4 = root.children[0]!;
  const e5 = e4.children[0]!;

  test("moves are spelled out with number and side", () => {
    expect(spokenMove(root)).toBe("Start position");
    expect(spokenMove(e4)).toBe("Move 1, white: Pawn to e4");
    expect(spokenMove(e5)).toBe("Move 1, black: Pawn to e5");
    expect(positionAnnouncement(e5, true)).toBe("Move 1, black: Pawn to e5, in a variation");
    expect(positionAnnouncement(root, true)).toBe("Start position");
  });

  test("board label says who's to move and the last move", () => {
    expect(boardLabel(root)).toBe("Chess board. White to move");
    expect(boardLabel(e4)).toBe("Chess board. Black to move. Last move: Move 1, white: Pawn to e4");
  });
});
