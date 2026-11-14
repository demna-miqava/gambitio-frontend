import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { countPlayerMoves, evaluateObjective, isHanging, objectiveLabel } from "./objective";
import type { EndgameExercise } from "../types";

type Spec = Pick<EndgameExercise, "fen" | "playerColor" | "objective">;

/** Plays SAN moves from the spec's position and evaluates the result. */
const after = (spec: Spec, moves: string[]) => {
  const chess = new Chess(spec.fen);
  for (const san of moves) chess.move(san);
  const playerMoves = countPlayerMoves(chess.history({ verbose: true }), spec.playerColor);
  return evaluateObjective(spec, chess, playerMoves);
};

const white = (fen: string, objective: EndgameExercise["objective"]): Spec => ({
  fen,
  playerColor: "white",
  objective,
});

describe("checkmate objective", () => {
  const corner = white("k7/8/2K5/8/8/8/8/7Q w - - 0 1", { type: "checkmate", maxMoves: 2 });

  it("is playing before mate", () => {
    expect(after(corner, ["Qb1", "Ka7"])).toEqual({ status: "playing", message: "" });
  });

  it("succeeds on checkmate", () => {
    expect(after(corner, ["Qb1", "Ka7", "Qb7#"])).toEqual({ status: "success", message: "Checkmate!" });
  });

  it("fails on stalemate", () => {
    const result = after(white("k7/8/1K6/8/8/8/8/2Q5 w - - 0 1", { type: "checkmate" }), ["Qc7"]);
    expect(result.status).toBe("failure");
    expect(result.message).toMatch(/^Stalemate/);
  });

  it("fails when the move limit runs out", () => {
    const result = after(corner, ["Qh7", "Kb8", "Qg8+"]);
    expect(result.status).toBe("failure");
    expect(result.message).toBe("No mate within 2 moves.");
  });

  it("fails when the player is mated", () => {
    // White plays on with a lone king against a queen
    const spec = white("8/8/8/8/8/1k6/2q5/K7 w - - 0 1", { type: "checkmate" });
    const mated = new Chess("8/8/8/8/8/1k6/2q5/K7 b - - 0 1");
    mated.move("Qb2#");
    expect(evaluateObjective(spec, mated, 0).status).toBe("failure");
  });

  it("fails when the opponent keeps a promoted queen, not when it can be taken", () => {
    const qvp = white("8/8/8/8/8/8/3pk3/K5Q1 w - - 0 1", { type: "checkmate", maxMoves: 35 });
    // A quiet move lets the pawn queen with check, out of reach
    const lost = after(qvp, ["Qb6", "d1=Q+"]);
    expect(lost.status).toBe("failure");
    expect(lost.message).toMatch(/promoted/);
    // Queening where the white queen can take it for free isn't lost yet
    const fen = "3Q4/8/8/8/8/8/3p4/K5k1 b - - 0 1";
    const covered = new Chess(fen);
    covered.move("d1=Q+");
    const evaluation = evaluateObjective(white(fen, { type: "checkmate" }), covered, 0);
    expect(evaluation).toEqual({ status: "playing", message: "The pawn promoted. Take the new piece!" });
  });
});

describe("promote objective", () => {
  const promote = { type: "promote" } as const;

  it("succeeds when the new queen is safe", () => {
    const spec = white("4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", promote);
    const result = after(spec, ["Kd6", "Kf7", "Kd7", "Kf8", "e6", "Kg7", "e7", "Kf7", "e8=Q+"]);
    expect(result).toEqual({ status: "success", message: "Promoted, and the new piece is safe." });
  });

  it("succeeds with mate on promotion", () => {
    expect(after(white("k7/2P5/1K6/8/8/8/8/8 w - - 0 1", promote), ["c8=Q#"]).message).toBe("Checkmate!");
  });

  it("fails when the new queen can be taken for free", () => {
    const result = after(white("8/4Pk2/8/8/8/8/8/K7 w - - 0 1", promote), ["e8=Q+"]);
    expect(result).toEqual({ status: "failure", message: "The new piece can be taken for free." });
  });

  it("fails on a stalemating promotion", () => {
    const result = after(white("8/6P1/8/8/8/8/2K5/k7 w - - 0 1", promote), ["g8=Q"]);
    expect(result).toEqual({ status: "failure", message: "Promoting drew the game by stalemate." });
  });

  it("fails when the last pawn is lost", () => {
    const spec = white("8/8/8/8/8/3k4/4P3/K7 b - - 0 1", promote);
    const result = after(spec, ["Kxe2"]);
    expect(result.status).toBe("failure");
    expect(result.message).toMatch(/drawn by insufficient material/);
    // With a rook still on the board, it's the lost pawn that's reported
    const withKnight = after(white("8/8/8/8/8/3k4/4P3/K6R b - - 0 1", promote), ["Kxe2"]);
    expect(withKnight).toEqual({ status: "failure", message: "You have no pawns left to promote." });
  });

  it("fails when the opponent queens first", () => {
    const spec = white("8/P7/8/8/8/4k3/p7/7K b - - 0 1", promote);
    expect(after(spec, ["a1=Q+"])).toEqual({ status: "failure", message: "Your opponent promoted first." });
  });
});

describe("draw objective", () => {
  const hold = white("8/8/8/8/4k3/4p3/8/4K3 w - - 0 1", { type: "draw", surviveMoves: 3 });

  it("succeeds after surviving the required moves", () => {
    expect(after(hold, ["Ke2", "Kd4", "Ke1"]).status).toBe("playing");
    expect(after(hold, ["Ke2", "Kd4", "Ke1", "Kd3", "Kd1"])).toEqual({
      status: "success",
      message: "You held for 3 moves. That's a draw.",
    });
  });

  it("succeeds on a draw by rule", () => {
    const bare = white("8/8/8/8/8/4p3/4K3/2k5 w - - 0 1", { type: "draw", surviveMoves: 20 });
    expect(after(bare, ["Kxe3"])).toEqual({
      status: "success",
      message: "Drawn by insufficient material. Well defended!",
    });
  });

  it("fails when the opponent queens", () => {
    const lost = white("8/8/8/8/8/4k3/4p3/7K w - - 0 1", { type: "draw", surviveMoves: 20 });
    expect(after(lost, ["Kg2", "e1=Q"]).status).toBe("failure");
  });

  it("fails when the player is mated", () => {
    const spec = white("8/8/8/8/8/1k6/2q5/K7 w - - 0 1", { type: "draw", surviveMoves: 20 });
    const mated = new Chess("8/8/8/8/8/1k6/2q5/K7 b - - 0 1");
    mated.move("Qb2#");
    expect(evaluateObjective(spec, mated, 3)).toEqual({ status: "failure", message: "You were checkmated." });
  });

  it("fails when the last piece is lost", () => {
    const rook = white("8/8/8/8/3kp3/7R/r7/4K3 w - - 0 1", { type: "draw", surviveMoves: 20 });
    expect(after(rook, ["Rd3+", "Kxd3"])).toEqual({ status: "failure", message: "You lost your last piece." });
  });
});

describe("isHanging", () => {
  it("knows a defended piece from a loose one", () => {
    // Black to move; the white queen on d2 is defended by the king on e1
    expect(isHanging(new Chess("8/8/8/8/8/2k5/3Q4/4K3 b - - 0 1"), "d2")).toBe(false);
    expect(isHanging(new Chess("8/8/8/8/8/2k5/3Q4/7K b - - 0 1"), "d2")).toBe(true);
  });
});

describe("objectiveLabel", () => {
  it("describes each objective", () => {
    expect(objectiveLabel({ type: "checkmate", maxMoves: 15 })).toBe("Checkmate within 15 moves");
    expect(objectiveLabel({ type: "checkmate" })).toBe("Checkmate");
    expect(objectiveLabel({ type: "promote" })).toBe("Promote a pawn without losing the new queen");
    expect(objectiveLabel({ type: "promote", maxMoves: 8 })).toBe("Promote a pawn safely within 8 moves");
    expect(objectiveLabel({ type: "draw", surviveMoves: 20 })).toBe("Hold the draw for 20 moves");
  });
});
