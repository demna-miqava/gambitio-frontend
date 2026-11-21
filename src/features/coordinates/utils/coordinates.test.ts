import { describe, expect, it } from "vitest";
import {
  ALL_SQUARES,
  DEFAULT_OPTIONS,
  bestFor,
  formatClock,
  isNewBest,
  parseOptions,
  randomSquare,
  recentFor,
  runStats,
  secondsLabel,
} from "./coordinates";
import type { CoordinateRun } from "../types";

describe("coordinates trainer", () => {
  it("has every square once", () => {
    expect(ALL_SQUARES).toHaveLength(64);
    expect(new Set(ALL_SQUARES).size).toBe(64);
    expect(ALL_SQUARES).toContain("a1");
    expect(ALL_SQUARES).toContain("h8");
  });

  it("never repeats the square before", () => {
    for (let i = 0; i < 200; i++) {
      expect(randomSquare("e4")).not.toBe("e4");
    }
    // Even at the edges of the random range
    expect(randomSquare("a1", () => 0)).toBe("a2");
    expect(randomSquare("h8", () => 0.9999999)).toBe("h7");
    expect(randomSquare(undefined, () => 0.9999999)).toBe("h8");
  });

  it("reads stored options, falling back on anything unknown", () => {
    expect(parseOptions(null)).toEqual(DEFAULT_OPTIONS);
    expect(parseOptions("not json")).toEqual(DEFAULT_OPTIONS);
    expect(parseOptions(JSON.stringify({ seconds: 120, perspective: "black", withPieces: false }))).toEqual({
      mode: "find",
      seconds: 120,
      perspective: "black",
      withPieces: false,
    });
    expect(parseOptions(JSON.stringify({ seconds: 45, perspective: "random", withPieces: "yes" }))).toEqual(
      DEFAULT_OPTIONS
    );
  });

  it("works out accuracy and time per square", () => {
    expect(runStats(20, 5, 30)).toEqual({ score: 20, misses: 5, accuracy: 80, secondsPerSquare: 1.5 });
    expect(runStats(0, 3, 30)).toEqual({ score: 0, misses: 3, accuracy: 0, secondsPerSquare: null });
    expect(runStats(0, 0, 30).accuracy).toBeNull();
  });

  it("formats the clock and run lengths", () => {
    expect(formatClock(30_000)).toBe("0:30");
    expect(formatClock(119_001)).toBe("2:00");
    expect(formatClock(59_400)).toBe("1:00");
    expect(formatClock(-5)).toBe("0:00");
    expect(secondsLabel(30)).toBe("30 s");
    expect(secondsLabel(120)).toBe("2 min");
  });

  it("finds the best and recent runs for the chosen options", () => {
    const bests = [
      { mode: "find", seconds: 30, perspective: "white", best: 21, achievedAt: "" },
      { mode: "find", seconds: 30, perspective: "black", best: 12, achievedAt: "" },
    ] as const;
    expect(bestFor([...bests], { mode: "find", seconds: 30, perspective: "black" })).toBe(12);
    expect(bestFor([...bests], { mode: "find", seconds: 60, perspective: "black" })).toBeNull();
    const run = (id: string, seconds: 30 | 60, score: number): CoordinateRun => ({
      id,
      mode: "find",
      seconds,
      perspective: "white",
      withPieces: true,
      score,
      misses: 0,
      createdAt: "",
    });
    const recent = [run("3", 30, 9), run("2", 60, 30), run("1", 30, 7)];
    expect(recentFor(recent, { mode: "find", seconds: 30, perspective: "white" }).map((r) => r.id)).toEqual([
      "3",
      "1",
    ]);
  });

  it("calls out a new best", () => {
    expect(isNewBest(10, null)).toBe(true);
    expect(isNewBest(0, null)).toBe(false);
    expect(isNewBest(10, 10)).toBe(false);
    expect(isNewBest(11, 10)).toBe(true);
  });
});
