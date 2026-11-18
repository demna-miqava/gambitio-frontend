import { describe, expect, it } from "vitest";
import {
  customPickerValues,
  defaultShorterClock,
  PLAY_TIME_CONTROLS,
  shorterClocks,
} from "./timeControls";

describe("time odds clocks", () => {
  it("offers only clocks shorter than the other player's, longest first", () => {
    expect(shorterClocks(300)).toEqual([240, 180, 150, 120, 90, 60, 45, 30, 15]);
    expect(shorterClocks(60)).toEqual([45, 30, 15]);
    expect(shorterClocks(15)).toEqual([]);
  });

  it("starts at about half the other clock", () => {
    expect(defaultShorterClock(300)).toBe(150);
    expect(defaultShorterClock(600)).toBe(300);
    expect(defaultShorterClock(180)).toBe(90);
    expect(defaultShorterClock(60)).toBe(30);
    // Nothing at half or below: the shortest there is
    expect(defaultShorterClock(20)).toBe(15);
    expect(defaultShorterClock(15)).toBeNull();
  });
});

describe("customPickerValues", () => {
  it("shows every preset as it is, so the inline picker can follow a picked preset", () => {
    for (const { options } of PLAY_TIME_CONTROLS) {
      for (const { time, increment } of options) {
        expect(customPickerValues({ time, increment })).toEqual({ minutes: time / 60, increment });
      }
    }
  });

  it("falls back to 10 minutes and no increment for values it doesn't offer", () => {
    expect(customPickerValues({ time: 15, increment: 7 })).toEqual({ minutes: 10, increment: 0 });
  });
});
