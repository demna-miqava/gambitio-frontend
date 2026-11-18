import { afterEach, describe, expect, it } from "vitest";
import { recordServerDate, resetServerClock, serverClockOffset } from "./serverClock";

const at = (iso: string) => new Date(iso).getTime();
const header = (iso: string) => new Date(iso).toUTCString();

describe("serverClock", () => {
  afterEach(resetServerClock);

  it("is 0 with nothing recorded, or a missing or broken header", () => {
    expect(serverClockOffset()).toBe(0);
    recordServerDate(undefined);
    recordServerDate("");
    recordServerDate("not a date");
    expect(serverClockOffset()).toBe(0);
  });

  it("ignores offsets under a couple of seconds (the header's rounding)", () => {
    recordServerDate(header("2026-11-18T12:00:01Z"), at("2026-11-18T12:00:00Z"));
    expect(serverClockOffset()).toBe(0);
  });

  it("estimates how far this device is behind or ahead", () => {
    // This device is 2 minutes slow
    recordServerDate(header("2026-11-18T12:02:00Z"), at("2026-11-18T12:00:00Z"));
    expect(serverClockOffset()).toBe(120_500);
    resetServerClock();
    // ... or 90 seconds fast
    recordServerDate(header("2026-11-18T12:00:00Z"), at("2026-11-18T12:01:30Z"));
    expect(serverClockOffset()).toBe(-89_500);
  });

  it("takes the median, so one odd response doesn't move it", () => {
    const now = at("2026-11-18T12:00:00Z");
    recordServerDate(header("2026-11-18T12:01:00Z"), now);
    recordServerDate(header("2026-11-18T12:01:00Z"), now);
    recordServerDate(header("2026-11-18T12:30:00Z"), now);
    expect(serverClockOffset()).toBe(60_500);
  });

  it("ignores a date days off (a cached response)", () => {
    recordServerDate(header("2026-11-10T12:00:00Z"), at("2026-11-18T12:00:00Z"));
    expect(serverClockOffset()).toBe(0);
  });
});
