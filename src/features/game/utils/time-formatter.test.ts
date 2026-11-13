import { describe, expect, it } from "vitest";
import { formatClock, formatTime } from "./time-formatter";

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5_000)).toBe("0:05");
    expect(formatTime(59_999)).toBe("0:59");
    expect(formatTime(60_000)).toBe("1:00");
    expect(formatTime(10 * 60_000 + 7_000)).toBe("10:07");
  });

  it("adds hours from an hour up", () => {
    expect(formatTime(60 * 60_000)).toBe("1:00:00");
    expect(formatTime(90 * 60_000 + 5_000)).toBe("1:30:05");
  });

  it("treats negative times as zero", () => {
    expect(formatTime(-500)).toBe("0:00");
    expect(formatTime(-500, true)).toBe("0.00");
  });

  it("shows centiseconds under a minute when asked", () => {
    expect(formatTime(9_870, true)).toBe("9.87");
    expect(formatTime(5, true)).toBe("0.00");
    expect(formatTime(59_990, true)).toBe("59.99");
  });

  it("never drops the minutes, even with centiseconds on", () => {
    expect(formatTime(60_000, true)).toBe("1:00");
    expect(formatTime(75_000, true)).toBe("1:15");
  });
});

describe("formatClock", () => {
  it("uses M:SS down to 10 seconds", () => {
    expect(formatClock(60_000)).toBe("1:00");
    expect(formatClock(59_000)).toBe("0:59");
    expect(formatClock(10_000)).toBe("0:10");
  });

  it("switches to centiseconds below 10 seconds", () => {
    expect(formatClock(9_999)).toBe("9.99");
    expect(formatClock(1_230)).toBe("1.23");
    expect(formatClock(0)).toBe("0.00");
  });
});
