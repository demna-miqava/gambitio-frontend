import { describe, expect, it } from "vitest";
import { sparklinePoints } from "./sparkline";

describe("sparklinePoints", () => {
  it("spreads the games across the width, the highest rating at the top", () => {
    const points = sparklinePoints([1500, 1520, 1490]);
    expect(points.map((p) => p.x)).toEqual([3, 36, 69]);
    // Highest at the top padding, lowest at the bottom padding
    expect(points[1].y).toBe(3);
    expect(points[2].y).toBe(21);
    expect(points[0].y).toBeGreaterThan(3);
    expect(points[0].y).toBeLessThan(21);
  });

  it("draws a run of equal ratings through the middle", () => {
    expect(sparklinePoints([1500, 1500, 1500]).map((p) => p.y)).toEqual([12, 12, 12]);
  });
});
