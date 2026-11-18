import { describe, expect, it } from "vitest";
import { formatCount, stepSpring, type SpringState } from "./spring";

/** Runs the spring frame by frame at 60 fps; returns the values shown */
function run(from: number, to: number, options = { stiffness: 120, damping: 35 }) {
  let state: SpringState & { done?: boolean } = { value: from, velocity: 0 };
  const values: number[] = [];
  for (let frame = 0; frame < 600 && !state.done; frame++) {
    state = stepSpring(state, to, 1 / 60, options);
    values.push(state.value);
  }
  return values;
}

describe("counting number spring", () => {
  it("counts a rating up and settles exactly on it", () => {
    const values = run(1500, 1512);
    expect(values.at(-1)).toBe(1512);
    // The rating's spring is overdamped: it never overshoots
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    // Takes a moment, like motion's spring with the same settings (about a second)
    expect(values.length).toBeGreaterThan(20);
    expect(values.length).toBeLessThan(180);
  });

  it("counts down too", () => {
    const values = run(1500, 1488);
    expect(values.at(-1)).toBe(1488);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(1488);
  });

  it("is at rest straight away on its target", () => {
    expect(stepSpring({ value: 7, velocity: 0 }, 7, 0, {})).toEqual({ value: 7, velocity: 0, done: true });
  });

  it("caps a long gap between frames", () => {
    const next = stepSpring({ value: 0, velocity: 0 }, 100, 30, { stiffness: 120, damping: 35 });
    expect(Number.isFinite(next.value)).toBe(true);
  });
});

describe("formatCount", () => {
  it("rounds to whole numbers by default", () => {
    expect(formatCount(1511.6, { decimals: 0, decimalSeparator: ".", padTo: 0 })).toBe("1512");
  });

  it("shows decimals with the separator and pads the whole part", () => {
    expect(formatCount(3.14159, { decimals: 2, decimalSeparator: ",", padTo: 3 })).toBe("003,14");
    expect(formatCount(7, { decimals: 0, decimalSeparator: ".", padTo: 2 })).toBe("07");
  });
});
