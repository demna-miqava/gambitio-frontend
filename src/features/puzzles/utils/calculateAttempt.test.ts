import { describe, expect, it } from "vitest";
import {
  calculateAttemptReducer,
  initialCalculateAttempt,
  isRunFinished,
  movesToEnter,
  type CalculateAction,
  type CalculateAttempt,
} from "./calculateAttempt";

const run = (state: CalculateAttempt, ...actions: CalculateAction[]) =>
  actions.reduce(calculateAttemptReducer, state);

describe("calculateAttemptReducer", () => {
  it("enters, removes the last move and clears while entering", () => {
    let s = run(initialCalculateAttempt("p1"), { type: "enter", line: ["e2e4"] }, { type: "enter", line: ["e2e4", "e7e5"] });
    expect(s.entered).toEqual(["e2e4", "e7e5"]);
    s = run(s, { type: "removeLast" });
    expect(s.entered).toEqual(["e2e4"]);
    s = run(s, { type: "clear" });
    expect(s.entered).toEqual([]);
  });

  it("freezes the line once submitted", () => {
    const submitted = run(
      initialCalculateAttempt("p1"),
      { type: "enter", line: ["e2e4"] },
      { type: "submit", verdict: { result: "solved" } }
    );
    expect(submitted.phase).toBe("replaying");
    expect(run(submitted, { type: "enter", line: [] }, { type: "removeLast" }, { type: "clear" })).toBe(submitted);
    expect(run(submitted, { type: "submit", verdict: { result: "failed", index: 0 } })).toBe(submitted);
  });

  it("ends after the replay of a solved or missed line", () => {
    const solution = ["e2e4", "e7e5", "g1f3"];
    const solved = run(initialCalculateAttempt("p1"), { type: "submit", verdict: { result: "solved" } }, { type: "replayed", solution });
    expect(solved.phase).toBe("done");
    const failed = run(
      initialCalculateAttempt("p1"),
      { type: "submit", verdict: { result: "failed", index: 2 } },
      { type: "replayed", solution }
    );
    expect(failed.phase).toBe("done");
  });

  it("after a reply predicted differently, fixes the line up to the real reply and enters the rest", () => {
    const solution = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"];
    const differs = run(
      initialCalculateAttempt("p1"),
      { type: "enter", line: ["e2e4", "c7c5", "g1f3"] },
      { type: "submit", verdict: { result: "reply-differs", index: 1 } },
      { type: "replayed", solution }
    );
    expect(differs).toEqual({
      puzzleId: "p1",
      entered: ["e2e4", "e7e5"],
      fixed: 2,
      phase: "entering",
      verdict: null,
      differed: { index: 1, predicted: "c7c5" },
    });
    // A late replay callback changes nothing
    expect(run(differs, { type: "replayed", solution })).toBe(differs);

    // The played moves stay: only the entered ones can go
    let s = run(differs, { type: "enter", line: ["e2e4", "e7e5", "g1f3"] });
    expect(s.entered).toEqual(["e2e4", "e7e5", "g1f3"]);
    expect(run(s, { type: "removeLast" }, { type: "removeLast" }).entered).toEqual(["e2e4", "e7e5"]);
    expect(run(s, { type: "clear" }).entered).toEqual(["e2e4", "e7e5"]);
    expect(run(differs, { type: "removeLast" })).toBe(differs);
    expect(run(differs, { type: "clear" })).toBe(differs);
    // A line that would change them is refused
    expect(run(differs, { type: "enter", line: ["d2d4", "e7e5", "g1f3"] })).toBe(differs);
    expect(run(differs, { type: "enter", line: ["e2e4"] })).toBe(differs);

    // Judged again; a second reply predicted differently fixes more
    s = run(
      s,
      { type: "enter", line: ["e2e4", "e7e5", "g1f3", "g8f6", "b1c3"] },
      { type: "submit", verdict: { result: "reply-differs", index: 3 } },
      { type: "replayed", solution }
    );
    expect(s.fixed).toBe(4);
    expect(s.entered).toEqual(["e2e4", "e7e5", "g1f3", "b8c6"]);
    expect(s.differed).toEqual({ index: 3, predicted: "g8f6" });
    s = run(
      s,
      { type: "enter", line: [...solution] },
      { type: "submit", verdict: { result: "solved" } },
      { type: "replayed", solution }
    );
    expect(s.phase).toBe("done");
  });

  it("counts the moves still to enter after the played ones", () => {
    expect(movesToEnter(5, 0)).toEqual({ own: 3, replies: 2 });
    expect(movesToEnter(5, 2)).toEqual({ own: 2, replies: 1 });
    expect(movesToEnter(5, 4)).toEqual({ own: 1, replies: 0 });
  });

  it("shows the run's end only once the last line has played out", () => {
    expect(isRunFinished(false, { phase: "done" })).toBe(false);
    expect(isRunFinished(true, { phase: "replaying" })).toBe(false);
    expect(isRunFinished(true, { phase: "done" })).toBe(true);
    expect(isRunFinished(true, { phase: "entering" })).toBe(true);
  });

  it("starts over for a new puzzle", () => {
    const s = run(initialCalculateAttempt("p1"), { type: "enter", line: ["e2e4"] }, { type: "reset", puzzleId: "p2" });
    expect(s).toEqual(initialCalculateAttempt("p2"));
    const fresh = initialCalculateAttempt("p2");
    expect(run(fresh, { type: "reset", puzzleId: "p2" })).toBe(fresh);
  });
});
