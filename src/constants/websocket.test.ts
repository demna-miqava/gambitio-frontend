import { describe, expect, it } from "vitest";
import {
  NOTIFICATIONS_RECONNECT_OPTIONS,
  RECONNECT_OPTIONS,
  backoffDelay,
  withJitter,
} from "./websocket";

describe("withJitter", () => {
  it("stays within ±30% of the delay", () => {
    expect(withJitter(1000, () => 0)).toBe(700);
    expect(withJitter(1000, () => 0.5)).toBe(1000);
    expect(withJitter(1000, () => 0.999999)).toBe(1300);
    for (let i = 0; i < 200; i++) {
      const ms = withJitter(10_000);
      expect(ms).toBeGreaterThanOrEqual(7_000);
      expect(ms).toBeLessThanOrEqual(13_000);
    }
  });
});

describe("backoffDelay", () => {
  const middle = () => 0.5;

  it("doubles from 1s up to the cap", () => {
    expect([0, 1, 2, 3, 4, 5].map((attempt) => backoffDelay(attempt, 10_000, middle))).toEqual([
      1000, 2000, 4000, 8000, 10_000, 10_000,
    ]);
  });

  it("stays at the cap for any number of attempts", () => {
    expect(backoffDelay(1_000, 30_000, middle)).toBe(30_000);
    expect(backoffDelay(Number.MAX_SAFE_INTEGER, 30_000, middle)).toBe(30_000);
  });
});

describe("reconnect options", () => {
  it("gives the game socket a bounded number of jittered attempts", () => {
    expect(RECONNECT_OPTIONS.reconnectAttempts).toBe(20);
    const delay = RECONNECT_OPTIONS.reconnectInterval(10);
    expect(delay).toBeGreaterThanOrEqual(7_000);
    expect(delay).toBeLessThanOrEqual(13_000);
  });

  it("never stops retrying the notifications socket, ~30s apart at most", () => {
    expect(NOTIFICATIONS_RECONNECT_OPTIONS.reconnectAttempts).toBe(Number.POSITIVE_INFINITY);
    expect(500 < NOTIFICATIONS_RECONNECT_OPTIONS.reconnectAttempts).toBe(true);
    const delay = NOTIFICATIONS_RECONNECT_OPTIONS.reconnectInterval(500);
    expect(delay).toBeGreaterThanOrEqual(21_000);
    expect(delay).toBeLessThanOrEqual(39_000);
  });
});
