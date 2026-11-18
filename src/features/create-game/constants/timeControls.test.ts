import { describe, expect, it } from "vitest";
import { defaultShorterClock, shorterClocks } from "./timeControls";

describe("time odds clocks", () => {
  it("offers only clocks shorter than the other player's, longest first", () => {
    expect(shorterClocks(300)).toEqual([180, 120, 60, 45, 30, 15]);
    expect(shorterClocks(60)).toEqual([45, 30, 15]);
    expect(shorterClocks(15)).toEqual([]);
  });

  it("starts at about half the other clock", () => {
    expect(defaultShorterClock(300)).toBe(120);
    expect(defaultShorterClock(600)).toBe(300);
    expect(defaultShorterClock(180)).toBe(60);
    expect(defaultShorterClock(60)).toBe(30);
    // Nothing at half or below: the shortest there is
    expect(defaultShorterClock(20)).toBe(15);
    expect(defaultShorterClock(15)).toBeNull();
  });
});
