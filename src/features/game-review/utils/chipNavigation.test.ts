import { describe, expect, test } from "vitest";
import type { MoveClassification, MoveReview, Side } from "../types";
import { nextMoveOfType } from "./chipNavigation";

const move = (index: number, classification: MoveClassification): MoveReview => ({
  index,
  san: "x",
  uci: "a1a2",
  side: (index % 2 === 0 ? "white" : "black") as Side,
  winChanceBefore: 0,
  winChanceAfter: 0,
  drop: 0,
  accuracy: 100,
  classification,
  forced: false,
  evalAfter: { type: "cp", value: 0 },
});

// Position index = move index + 1. White blunders at moves 2 and 6 (positions
// 3 and 7), black's only mistake at move 3 (position 4)
const moves = [
  move(0, "best"),
  move(1, "good"),
  move(2, "blunder"),
  move(3, "mistake"),
  move(4, "inaccuracy"),
  move(5, "best"),
  move(6, "blunder"),
];

describe("nextMoveOfType", () => {
  test("goes to the side's next move of that kind after the current position", () => {
    expect(nextMoveOfType(moves, "white", "blunder", 0)).toBe(3);
    expect(nextMoveOfType(moves, "white", "blunder", 3)).toBe(7);
    expect(nextMoveOfType(moves, "white", "blunder", 5)).toBe(7);
  });

  test("wraps around to the first one", () => {
    expect(nextMoveOfType(moves, "white", "blunder", 7)).toBe(3);
    // A single one: always that one, also from itself
    expect(nextMoveOfType(moves, "black", "mistake", 4)).toBe(4);
  });

  test("starts from the first one in a variation", () => {
    expect(nextMoveOfType(moves, "white", "blunder", -1)).toBe(3);
  });

  test("only counts the requested side and kind", () => {
    expect(nextMoveOfType(moves, "black", "blunder", 0)).toBeNull();
    expect(nextMoveOfType(moves, "white", "mistake", 0)).toBeNull();
    expect(nextMoveOfType(moves, "white", "inaccuracy", 0)).toBe(5);
  });
});
