import { describe, expect, it } from "vitest";
import { playedAgoShort } from "./opponentDetail";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const ago = (ms: number) => playedAgoShort(new Date(NOW - ms).toISOString(), NOW);
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("playedAgoShort", () => {
  it("is null when you haven't played lately", () => {
    expect(playedAgoShort(null, NOW)).toBeNull();
  });

  it("uses the largest unit that fits", () => {
    expect(ago(20_000)).toBe("Played just now");
    expect(ago(12 * MIN)).toBe("Played 12m ago");
    expect(ago(5 * HOUR + 59 * MIN)).toBe("Played 5h ago");
    expect(ago(DAY)).toBe("Played 1d ago");
    expect(ago(13 * DAY)).toBe("Played 13d ago");
    expect(ago(14 * DAY)).toBe("Played 2w ago");
    expect(ago(59 * DAY)).toBe("Played 8w ago");
    expect(ago(60 * DAY)).toBe("Played 2mo ago");
    expect(ago(364 * DAY)).toBe("Played 12mo ago");
    expect(ago(800 * DAY)).toBe("Played 2y ago");
  });

  it("treats a time ahead of this device's clock as now", () => {
    expect(ago(-5 * MIN)).toBe("Played just now");
  });
});
