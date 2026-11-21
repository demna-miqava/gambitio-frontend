import { describe, expect, it } from "vitest";
import {
  EMPTY_PLACEMENT,
  STARTING_POSITION,
  enPassantOptions,
  isValidPlacement,
  normalizePosition,
  parseFen,
  playablePositionFromFen,
  positionProblem,
  supportedCastling,
  toFen,
  withPieceAt,
} from "./editorPosition";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("board editor position", () => {
  it("reads and writes FENs, with defaults for missing fields", () => {
    expect(toFen(parseFen(START)!)).toBe(START);
    expect(toFen(STARTING_POSITION)).toBe(START);
    expect(toFen(parseFen("4k3/8/8/8/8/8/8/4K3")!)).toBe("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(toFen(parseFen("  4k3/8/8/8/8/8/8/4K3   b  ")!)).toBe("4k3/8/8/8/8/8/8/4K3 b - - 0 1");
  });

  it("refuses text that isn't a FEN", () => {
    for (const bad of [
      "",
      "hello",
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP",
      "rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR",
      "rnbqkbnr/pppppppp/44/8/8/8/PPPPPPPP/RNBQKBNR",
      "rnbqkbnr/ppppxppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
      `${START.split(" ")[0]} x KQkq - 0 1`,
      `${START.split(" ")[0]} w KKq - 0 1`,
      `${START.split(" ")[0]} w KQkq e4 0 1`,
      `${START.split(" ")[0]} w KQkq - 0 0`,
      `${START} extra`,
    ]) {
      expect(parseFen(bad), bad).toBeNull();
    }
    expect(isValidPlacement(EMPTY_PLACEMENT)).toBe(true);
  });

  it("drops castling rights the pieces can't support", () => {
    // White's king has moved off e1; Black's h-rook is gone
    const p = parseFen("rnbqkbn1/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1KNR w KQkq - 0 1")!;
    expect(p.castling).toEqual(["q"]);
    expect(supportedCastling("r3k2r/8/8/8/8/8/8/R3K2R")).toEqual(["K", "Q", "k", "q"]);
  });

  it("offers en passant only where a pawn could just have moved two squares", () => {
    // Black pawn on d5 next to a white pawn on e5, d6 and d7 empty
    expect(enPassantOptions("4k3/8/8/3pP3/8/8/8/4K3", "w")).toEqual(["d6"]);
    // The same with d7 occupied: the pawn can't have come from there
    expect(enPassantOptions("4k3/3n4/8/3pP3/8/8/8/4K3", "w")).toEqual([]);
    expect(enPassantOptions("4k3/8/8/8/3Pp3/8/8/4K3", "b")).toEqual(["d3"]);
    expect(enPassantOptions("4k3/8/8/8/3Pp3/8/8/4K3", "w")).toEqual([]);
    expect(parseFen("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1")!.enPassant).toBe("d6");
    expect(parseFen("4k3/8/8/3pP3/8/8/8/4K3 b - d6 0 1")!.enPassant).toBeNull();
    expect(normalizePosition({ ...parseFen("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1")!, placement: "4k3/8/8/4P3/8/8/8/4K3" }).enPassant).toBeNull();
  });

  it("says in plain words what's wrong with a position", () => {
    expect(positionProblem(STARTING_POSITION)).toBeNull();
    expect(positionProblem(parseFen("8/8/8/8/8/8/8/4K3")!)).toMatch(/no black king/);
    expect(positionProblem(parseFen("k6k/8/8/8/8/8/8/4K3")!)).toMatch(/2 black kings/);
    expect(positionProblem(parseFen("4k3/8/8/8/8/8/8/P3K3")!)).toMatch(/first or last rank/);
    // Black is in check from the rook, and it's White's move
    expect(positionProblem(parseFen("4k3/8/8/8/8/8/8/4RK2 w - - 0 1")!)).toMatch(/Black is in check with White to move/);
    expect(positionProblem(parseFen("4k3/8/8/8/8/8/8/4RK2 b - - 0 1")!)).toBeNull();
    // Kings side by side: whoever isn't to move is in check
    expect(positionProblem(parseFen("8/8/8/8/8/8/8/3Kk3 w - - 0 1")!)).toMatch(/in check/);
  });

  it("takes a FEN from a link only when it can be played", () => {
    expect(playablePositionFromFen("4k3/8/8/8/8/8/8/4K3 b - - 0 1")?.turn).toBe("b");
    expect(playablePositionFromFen("8/8/8/8/8/8/8/8 w - - 0 1")).toBeNull();
    expect(playablePositionFromFen("nonsense")).toBeNull();
    expect(playablePositionFromFen(null)).toBeNull();
  });

  it("changes one square", () => {
    expect(withPieceAt(EMPTY_PLACEMENT, "e1", "K")).toBe("8/8/8/8/8/8/8/4K3");
    expect(withPieceAt("8/8/8/8/8/8/8/4K3", "e1", null)).toBe(EMPTY_PLACEMENT);
    expect(withPieceAt("8/8/8/8/8/8/8/4K3", "h8", "k")).toBe("7k/8/8/8/8/8/8/4K3");
  });
});
