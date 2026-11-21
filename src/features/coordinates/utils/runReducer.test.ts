import { describe, expect, it } from "vitest";
import { initialRun, runReducer, type RunState } from "./runReducer";

const click = (state: RunState, square: string, now: number, fresh = "a1") =>
  runReducer(state, { type: "click", square: square as never, now, fresh: fresh as never });

describe("coordinates run", () => {
  it("starts the clock on the first click, which counts", () => {
    const ready = initialRun(30_000, "e4", "d5");
    expect(ready.phase).toBe("ready");
    expect(ready.endsAt).toBeNull();
    const first = click(ready, "e4", 1_000, "h8");
    expect(first.phase).toBe("running");
    expect(first.endsAt).toBe(31_000);
    expect(first.score).toBe(1);
    expect(first.target).toBe("d5");
    expect(first.next).toBe("h8");
    expect(first.feedback).toEqual({ kind: "right", square: "e4", id: 1 });
  });

  it("a wrong click is a miss and keeps the target", () => {
    let state = click(initialRun(30_000, "e4", "d5"), "e5", 0);
    expect(state.misses).toBe(1);
    expect(state.score).toBe(0);
    expect(state.target).toBe("e4");
    expect(state.next).toBe("d5");
    expect(state.phase).toBe("running");
    state = click(state, "e5", 10);
    expect(state.feedback).toEqual({ kind: "wrong", square: "e5", id: 2 });
    state = click(state, "e4", 20);
    expect(state).toMatchObject({ score: 1, misses: 2, target: "d5" });
  });

  it("ends when the clock runs out, and ignores clicks after", () => {
    let state = click(initialRun(30_000, "e4", "d5"), "e4", 0);
    expect(runReducer(state, { type: "timeUp", now: 29_999 }).phase).toBe("running");
    // A click that lands after the deadline doesn't count
    const late = click(state, "d5", 30_000);
    expect(late).toMatchObject({ phase: "finished", score: 1 });
    state = runReducer(state, { type: "timeUp", now: 30_000 });
    expect(state.phase).toBe("finished");
    expect(click(state, "d5", 30_001)).toBe(state);
  });

  it("the clock can't run out before the first click", () => {
    const ready = initialRun(30_000, "e4", "d5");
    expect(runReducer(ready, { type: "timeUp", now: 1e12 })).toBe(ready);
  });
});
