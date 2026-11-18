import { describe, expect, it } from "vitest";
import { describeOutcome, moveNumberLabel, reviewLabel } from "./describe";

describe("drill wording", () => {
  it("describes the game's outcome for the player", () => {
    expect(describeOutcome({ result: "draw", endReason: "threefold_repetition" })).toBe("Drawn");
    expect(describeOutcome({ result: "black_win", endReason: "timeout" })).toBe("Lost on time");
    expect(describeOutcome({ result: "white_win", endReason: "checkmate" })).toBe("Lost");
  });

  it("numbers moves from half-moves", () => {
    expect(moveNumberLabel(0)).toBe("Move 1");
    expect(moveNumberLabel(44)).toBe("Move 23");
    expect(moveNumberLabel(45)).toBe("Move 23");
  });

  it("says when a drill comes back", () => {
    const now = Date.parse("2026-11-18T12:00:00Z");
    expect(reviewLabel({ attempts: 0, successes: 0, dueAt: "2026-11-18T11:00:00Z" }, now)).toBe("New");
    expect(reviewLabel({ attempts: 2, successes: 0, dueAt: "2026-11-18T11:00:00Z" }, now)).toBe(
      "Converted 0 of 2 · due now"
    );
    expect(reviewLabel({ attempts: 3, successes: 2, dueAt: "2026-11-21T12:00:00Z" }, now)).toBe(
      "Converted 2 of 3 · next in 3 days"
    );
  });
});
