import { describe, expect, it } from "vitest";
import {
  calculateAttemptReducer,
  initialCalculateAttempt,
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

  it("ends after the replay, or goes on move by move when a reply differed", () => {
    const solved = run(initialCalculateAttempt("p1"), { type: "submit", verdict: { result: "solved" } }, { type: "replayed" });
    expect(solved.phase).toBe("done");
    const failed = run(initialCalculateAttempt("p1"), { type: "submit", verdict: { result: "failed", index: 2 } }, { type: "replayed" });
    expect(failed.phase).toBe("done");
    const differs = run(
      initialCalculateAttempt("p1"),
      { type: "submit", verdict: { result: "reply-differs", index: 1 } },
      { type: "replayed" }
    );
    expect(differs.phase).toBe("finishing");
    // A late replay callback changes nothing
    expect(run(differs, { type: "replayed" })).toBe(differs);
  });

  it("starts over for a new puzzle", () => {
    const s = run(initialCalculateAttempt("p1"), { type: "enter", line: ["e2e4"] }, { type: "reset", puzzleId: "p2" });
    expect(s).toEqual(initialCalculateAttempt("p2"));
    const fresh = initialCalculateAttempt("p2");
    expect(run(fresh, { type: "reset", puzzleId: "p2" })).toBe(fresh);
  });
});
