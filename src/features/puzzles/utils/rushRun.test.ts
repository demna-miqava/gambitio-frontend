import { describe, expect, it } from "vitest";
import {
  RUSH_RULES,
  initialRushRun,
  isNewPersonalBest,
  parsePersonalBest,
  rushRunReducer,
  type RushRunAction,
  type RushRunState,
} from "./rushRun";

const run = (state: RushRunState, ...actions: RushRunAction[]) =>
  actions.reduce(rushRunReducer, state);

/** A run that has just started playing at t = 3000 */
const playing = () =>
  run(initialRushRun(), { type: "start", now: 0, best: 0 }, { type: "tick", now: RUSH_RULES.COUNTDOWN_MS });

describe("rushRunReducer", () => {
  it("waits at the start gate: ticks, solves and strikes do nothing", () => {
    const ready = initialRushRun(5);
    expect(ready.phase).toBe("ready");
    expect(run(ready, { type: "tick", now: 10_000 }, { type: "solved" }, { type: "failed" })).toBe(ready);
  });

  it("counts down 3-2-1, then starts the full clock", () => {
    let s = run(initialRushRun(), { type: "start", now: 1000, best: 0 });
    expect(s).toMatchObject({ phase: "countdown", countdown: 3, timeLeft: 180 });
    s = run(s, { type: "tick", now: 2100 });
    expect(s.countdown).toBe(2);
    s = run(s, { type: "tick", now: 3100 });
    expect(s.countdown).toBe(1);
    // A late tick still gives the player the whole three minutes
    s = run(s, { type: "tick", now: 4500 });
    expect(s).toMatchObject({ phase: "playing", timeLeft: 180, phaseEndsAt: 4500 + RUSH_RULES.DURATION_MS });
  });

  it("ignores solves and strikes during the countdown", () => {
    const s = run(initialRushRun(), { type: "start", now: 0, best: 0 });
    expect(run(s, { type: "solved" }, { type: "failed" })).toBe(s);
  });

  it("follows the wall clock and ends on time", () => {
    const start = RUSH_RULES.COUNTDOWN_MS;
    let s = playing();
    s = run(s, { type: "tick", now: start + 1500 });
    expect(s.timeLeft).toBe(179);
    const same = run(s, { type: "tick", now: start + 1600 });
    expect(same).toBe(s); // no re-render for an unchanged second
    s = run(s, { type: "solved" }, { type: "tick", now: start + RUSH_RULES.DURATION_MS });
    expect(s).toMatchObject({ phase: "over", timeLeft: 0, endReason: "time", score: 1 });
  });

  it("scores solves and ends the run on the third strike", () => {
    let s = run(playing(), { type: "solved" }, { type: "failed" }, { type: "solved" }, { type: "failed" });
    expect(s).toMatchObject({ phase: "playing", score: 2, strikes: 2 });
    s = run(s, { type: "failed" });
    expect(s).toMatchObject({ phase: "over", strikes: 3, endReason: "strikes", phaseEndsAt: null });
    // Nothing counts once it's over
    expect(run(s, { type: "solved" }, { type: "failed" }, { type: "tick", now: 1e9 })).toBe(s);
  });

  it("restarts cleanly from game over", () => {
    const over = run(playing(), { type: "solved" }, { type: "failed" }, { type: "failed" }, { type: "failed" });
    const s = run(over, { type: "start", now: 500_000, best: 1 });
    expect(s).toMatchObject({
      phase: "countdown",
      countdown: 3,
      timeLeft: 180,
      score: 0,
      strikes: 0,
      endReason: null,
      previousBest: 1,
      phaseEndsAt: 500_000 + RUSH_RULES.COUNTDOWN_MS,
    });
  });

  it("can't restart a run in progress", () => {
    const s = playing();
    expect(run(s, { type: "start", now: 99, best: 0 })).toBe(s);
  });
});

describe("isNewPersonalBest", () => {
  const finish = (best: number, solves: number) => {
    let s = run(initialRushRun(), { type: "start", now: 0, best }, { type: "tick", now: RUSH_RULES.COUNTDOWN_MS });
    for (let i = 0; i < solves; i++) s = run(s, { type: "solved" });
    return run(s, { type: "failed" }, { type: "failed" }, { type: "failed" });
  };

  it("needs a finished run that beats the previous best", () => {
    expect(isNewPersonalBest(finish(4, 5))).toBe(true);
    expect(isNewPersonalBest(finish(5, 5))).toBe(false);
    expect(isNewPersonalBest(finish(0, 0))).toBe(false);
    expect(isNewPersonalBest(playing())).toBe(false);
  });
});

describe("parsePersonalBest", () => {
  it("accepts whole positive numbers only", () => {
    expect(parsePersonalBest(12)).toBe(12);
    expect(parsePersonalBest(0)).toBe(0);
    expect(parsePersonalBest(-3)).toBe(0);
    expect(parsePersonalBest(2.5)).toBe(0);
    expect(parsePersonalBest("12")).toBe(0);
    expect(parsePersonalBest(null)).toBe(0);
  });
});
