import { describe, expect, it } from "vitest";
import { formatTableClock } from "./formatTableClock";

describe("formatTableClock", () => {
  it("shows minutes and seconds, hours when needed, tenths at the end", () => {
    expect(formatTableClock(300_000)).toBe("5:00");
    expect(formatTableClock(299_001)).toBe("5:00");
    expect(formatTableClock(298_999)).toBe("4:59");
    expect(formatTableClock(5_400_000)).toBe("1:30:00");
    expect(formatTableClock(10_000)).toBe("0:10");
    expect(formatTableClock(9_999)).toBe("9.9");
    expect(formatTableClock(-5)).toBe("0.0");
  });

  it("reads out in words", () => {
    expect(formatTableClock(299_000, true)).toBe("4 minutes 59 seconds");
    expect(formatTableClock(9_000, true)).toBe("9 seconds");
  });
});
