import { Chess } from "chess.js";
import { describe, expect, it, vi } from "vitest";
import {
  currentHistory,
  fenAfter,
  lastMoveSquares,
  nextHistory,
  readHistory,
  sameMoves,
  type MoveHistory,
} from "./moveHistory";

const START: MoveHistory = { fen: new Chess().fen(), moves: [] };

/** Plays the moves, recording each one like the board does after chess.move() */
function play(chess: Chess, sans: string[], history: MoveHistory = START) {
  for (const san of sans) history = nextHistory(chess, history, chess.move(san));
  return history;
}

const lans = (history: MoveHistory) => history.moves.map((m) => m.lan);

describe("move history", () => {
  it("adds a played move without replaying the game", () => {
    const chess = new Chess();
    const replay = vi.spyOn(chess, "history");
    const history = play(chess, ["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    expect(replay).not.toHaveBeenCalled();
    replay.mockRestore();
    expect(history.moves).toEqual(chess.history({ verbose: true }));
    expect(history.fen).toBe(chess.fen());
  });

  it("replays after a takeback (the board goes back)", () => {
    const chess = new Chess();
    let history = play(chess, ["e4", "e5", "Nf3"]);
    chess.undo();
    chess.undo();
    history = nextHistory(chess, history);
    expect(lans(history)).toEqual(["e2e4"]);
    expect(history.fen).toBe(chess.fen());
  });

  it("replays a resync that replaces moves without changing their count", () => {
    const chess = new Chess();
    const before = play(chess, ["e4", "e5"]);
    chess.loadPgn("1. d4 d5");
    const after = nextHistory(chess, before);
    expect(after.moves).not.toBe(before.moves);
    expect(lans(after)).toEqual(["d2d4", "d7d5"]);
  });

  it("tells a transposed resync apart, though it reaches the same position", () => {
    const chess = new Chess();
    const before = play(chess, ["Nf3", "Nf6", "Nc3", "Nc6"]);
    chess.loadPgn("1. Nc3 Nc6 2. Nf3 Nf6");
    expect(chess.fen()).toBe(before.fen);
    const after = nextHistory(chess, before);
    expect(after.moves).not.toBe(before.moves);
    expect(lans(after)).toEqual(["b1c3", "b8c6", "g1f3", "g8f6"]);
  });

  it("keeps the same array when a resync changes nothing", () => {
    const chess = new Chess();
    const before = play(chess, ["e4", "e5"]);
    chess.loadPgn("1. e4 e5");
    expect(nextHistory(chess, before).moves).toBe(before.moves);
  });

  it("replays when the move doesn't continue the recorded line", () => {
    const chess = new Chess();
    const recorded = play(chess, ["e4"]);
    // Played on the game without being recorded, then another move
    chess.move("e5");
    const history = nextHistory(chess, recorded, chess.move("Nf3"));
    expect(lans(history)).toEqual(["e2e4", "e7e5", "g1f3"]);
  });

  it("replays when the move was played on another board", () => {
    const chess = new Chess();
    const recorded = play(chess, ["e4"]);
    const other = new Chess();
    const history = nextHistory(chess, recorded, other.move("d4"));
    expect(lans(history)).toEqual(["e2e4"]);
  });

  it("starts from a loaded position", () => {
    const fen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
    const chess = new Chess(fen);
    const history = play(chess, ["Kd2"], readHistory(chess));
    expect(history.moves[0].before).toBe(fen);
    expect(fenAfter(history.moves, 0)).toBe(fen);
  });
});

describe("currentHistory", () => {
  it("reuses the cache while the game is where it was", () => {
    const chess = new Chess();
    const history = play(chess, ["e4", "e5"]);
    const replay = vi.spyOn(chess, "history");
    expect(currentHistory(chess, history)).toBe(history);
    expect(replay).not.toHaveBeenCalled();
  });

  it("reads the game again after a change nobody recorded", () => {
    const chess = new Chess();
    const history = play(chess, ["e4", "e5"]);
    chess.undo();
    expect(lans(currentHistory(chess, history))).toEqual(["e2e4"]);
  });
});

describe("helpers", () => {
  const chess = new Chess();
  const { moves } = play(chess, ["e4", "e5", "Nf3"]);

  it("finds the last move's squares", () => {
    expect(lastMoveSquares(moves)).toEqual(["g1", "f3"]);
    expect(lastMoveSquares([])).toBeUndefined();
  });

  it("gives the position after a number of moves", () => {
    const replay = new Chess();
    expect(fenAfter(moves, 0)).toBe(replay.fen());
    replay.move("e4");
    expect(fenAfter(moves, 1)).toBe(replay.fen());
    replay.move("e5");
    replay.move("Nf3");
    expect(fenAfter(moves, 3)).toBe(replay.fen());
    // Past the end: the last position
    expect(fenAfter(moves, 9)).toBe(replay.fen());
    expect(fenAfter([], 0)).toBeUndefined();
  });

  it("compares lines by the positions they reach", () => {
    const again = new Chess();
    const same = play(again, ["e4", "e5", "Nf3"]).moves;
    expect(sameMoves(moves, same)).toBe(true);
    expect(sameMoves(moves, same.slice(0, 2))).toBe(false);
    expect(sameMoves([], [])).toBe(true);
  });
});
