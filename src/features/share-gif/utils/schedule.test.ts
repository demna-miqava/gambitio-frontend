import { describe, expect, test } from "vitest";
import {
  FIRST_FRAME_MS,
  LAST_FRAME_MS,
  MAX_GIF_FRAMES,
  MIN_MOVE_FRAME_MS,
  MOVE_FRAME_MS,
  MOVES_BUDGET_MS,
  frameDelays,
  moveFrameDelay,
} from "./schedule";

describe("frame timing", () => {
  test("start ~1 s, each move 700 ms, final position 3 s", () => {
    expect(frameDelays(5)).toEqual([FIRST_FRAME_MS, MOVE_FRAME_MS, MOVE_FRAME_MS, MOVE_FRAME_MS, LAST_FRAME_MS]);
    expect([FIRST_FRAME_MS, MOVE_FRAME_MS, LAST_FRAME_MS]).toEqual([1000, 700, 3000]);
  });

  test("edge cases", () => {
    expect(frameDelays(0)).toEqual([]);
    expect(frameDelays(1)).toEqual([LAST_FRAME_MS]);
    expect(frameDelays(2)).toEqual([FIRST_FRAME_MS, LAST_FRAME_MS]);
  });

  test("normal games keep the normal pace", () => {
    expect(moveFrameDelay(80)).toBe(MOVE_FRAME_MS);
  });

  test("long games speed up to fit the budget, in whole hundredths", () => {
    const delay = moveFrameDelay(122); // 120 move frames
    expect(delay).toBe(500);
    const capped = moveFrameDelay(MAX_GIF_FRAMES);
    expect(capped).toBeLessThan(MOVE_FRAME_MS);
    expect(capped).toBeGreaterThanOrEqual(MIN_MOVE_FRAME_MS);
    expect(capped % 10).toBe(0);
    expect(capped * (MAX_GIF_FRAMES - 2)).toBeLessThanOrEqual(MOVES_BUDGET_MS + 10 * MAX_GIF_FRAMES);
  });

  test("never faster than the minimum", () => {
    expect(moveFrameDelay(10_000)).toBe(MIN_MOVE_FRAME_MS);
  });
});
