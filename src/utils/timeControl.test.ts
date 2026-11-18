import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatCompactGameTime,
  formatGameTime,
  formatTimeControl,
  formatTimeOdds,
  hasTimeOdds,
  timeOdds,
} from "./timeControl";

describe("formatTimeControl", () => {
  it("always shows minutes+increment", () => {
    expect(formatTimeControl(300)).toBe("5+0");
    expect(formatTimeControl(300, 0)).toBe("5+0");
    expect(formatTimeControl(180, 2)).toBe("3+2");
    expect(formatTimeControl(900, 10)).toBe("15+10");
    expect(formatTimeControl(5400, 30)).toBe("90+30");
  });

  it("treats a null increment as 0", () => {
    expect(formatTimeControl(600, null)).toBe("10+0");
  });

  it("uses fractions for sub-minute starting times", () => {
    expect(formatTimeControl(15)).toBe("¼+0");
    expect(formatTimeControl(30)).toBe("½+0");
    expect(formatTimeControl(45, 1)).toBe("¾+1");
  });

  it("falls back to a decimal for other times", () => {
    expect(formatTimeControl(90)).toBe("1.5+0");
    expect(formatTimeControl(20)).toBe("0.33+0");
  });
});

describe("time odds", () => {
  it("writes a clock in words", () => {
    expect(formatClock(300)).toBe("5 min");
    expect(formatClock(60)).toBe("1 min");
    expect(formatClock(30)).toBe("30 sec");
    expect(formatClock(90)).toBe("1.5 min");
  });

  it("only counts two known, different clocks as odds", () => {
    expect(timeOdds(300, 60)).toEqual([300, 60]);
    expect(timeOdds(300, 300)).toBeNull();
    expect(timeOdds(null, 60)).toBeNull();
    expect(timeOdds(300, undefined)).toBeNull();
    expect(hasTimeOdds(60, 300)).toBe(true);
    expect(hasTimeOdds(null, null)).toBe(false);
  });

  it("shows both clocks in the order given, with the increment when there is one", () => {
    expect(formatTimeOdds(300, 60)).toBe("5 min vs 1 min");
    expect(formatTimeOdds(60, 30, 0)).toBe("1 min vs 30 sec");
    expect(formatTimeOdds(300, 60, 2)).toBe("5 min vs 1 min, +2 sec");
  });

  it("labels a game by its time control unless it has odds", () => {
    expect(formatGameTime({ time: 300, increment: 0 })).toBe("5+0");
    expect(formatGameTime({ time: 300, increment: 0, whiteTime: null, blackTime: null })).toBe("5+0");
    expect(formatGameTime({ time: 300, increment: 2, whiteTime: 60, blackTime: 300 })).toBe(
      "1 min vs 5 min, +2 sec"
    );
  });
});

describe("formatCompactGameTime", () => {
  it("writes both clocks in minutes+increment, white's first", () => {
    expect(formatCompactGameTime({ time: 300, increment: 0 })).toBe("5+0");
    expect(formatCompactGameTime({ time: 600, increment: 0, whiteTime: 600, blackTime: 120 })).toBe(
      "10+0 vs 2+0"
    );
    expect(formatCompactGameTime({ time: 180, increment: 2, whiteTime: 30, blackTime: 180 })).toBe(
      "½+2 vs 3+2"
    );
  });
});
