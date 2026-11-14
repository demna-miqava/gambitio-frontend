import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { ENDGAME_CATEGORIES, ENDGAME_EXERCISES, getEndgameExercise, nextEndgameExercise } from "./exercises";
import { evaluateObjective } from "../utils/objective";

describe("endgame exercises", () => {
  it("have unique ids the server accepts", () => {
    const ids = ENDGAME_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,60}$/);
  });

  it.each(ENDGAME_EXERCISES.map((e) => [e.id, e] as const))("%s is a legal, open position", (_, exercise) => {
    const chess = new Chess(exercise.fen);
    expect(chess.isGameOver()).toBe(false);
    expect(chess.turn()).toBe(exercise.playerColor === "white" ? "w" : "b");
    // The move list numbers from 1. White, so exercises start there
    expect(exercise.playerColor).toBe("white");
    expect(exercise.fen.endsWith(" 0 1")).toBe(true);
    // Nothing is decided before the first move
    expect(evaluateObjective(exercise, chess, 0).status).toBe("playing");
    expect(exercise.hints.length).toBeGreaterThanOrEqual(1);
    expect(exercise.hints.length).toBeLessThanOrEqual(3);
    expect(ENDGAME_CATEGORIES.map((c) => c.name)).toContain(exercise.category);
  });

  it("checkmate limits leave room for par", () => {
    for (const exercise of ENDGAME_EXERCISES) {
      if (exercise.objective.type === "checkmate" && exercise.objective.maxMoves && exercise.par) {
        expect(exercise.objective.maxMoves).toBeGreaterThanOrEqual(exercise.par);
      }
    }
  });

  it("every category has exercises", () => {
    for (const { name } of ENDGAME_CATEGORIES) {
      expect(ENDGAME_EXERCISES.some((e) => e.category === name)).toBe(true);
    }
  });

  it("finds exercises and the next one", () => {
    expect(getEndgameExercise("queen-mate")?.title).toBe("King and queen mate");
    expect(getEndgameExercise("nope")).toBeUndefined();
    expect(nextEndgameExercise(ENDGAME_EXERCISES[0]!.id)).toBe(ENDGAME_EXERCISES[1]);
    expect(nextEndgameExercise(ENDGAME_EXERCISES.at(-1)!.id)).toBeUndefined();
  });
});
