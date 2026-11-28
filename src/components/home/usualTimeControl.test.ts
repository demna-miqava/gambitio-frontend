import { describe, expect, it } from "vitest";
import { FIRST_GAME, QUICK_TIME_CONTROLS, usualTimeControl } from "./usualTimeControl";

const game = (time: number | null, increment: number | null = 0) => ({ time, increment });

describe("usualTimeControl", () => {
  it("offers nine time controls, and 10+0 as a first game", () => {
    expect(QUICK_TIME_CONTROLS.map((control) => control.label)).toEqual([
      "1+0", "1+1", "2+1", "3+0", "3+2", "5+0", "10+0", "15+10", "30+0",
    ]);
    expect(FIRST_GAME.label).toBe("10+0");
  });

  it("is the time control played most", () => {
    expect(usualTimeControl([game(300), game(180, 2), game(180, 2), game(600)])?.label).toBe("3+2");
  });

  it("prefers the more recent one on a tie (games come newest first)", () => {
    expect(usualTimeControl([game(600), game(180, 2)])?.label).toBe("10+0");
  });

  it("ignores games at other time controls, and bot games without a clock", () => {
    expect(usualTimeControl([game(420, 3), game(null, null)])).toBeNull();
    expect(usualTimeControl([game(420, 3), game(60, null)])?.label).toBe("1+0");
    expect(usualTimeControl([])).toBeNull();
  });
});
