import { describe, expect, it } from "vitest";
import { botThinkDelayMs } from "./thinkDelay";

describe("botThinkDelayMs", () => {
  it("stays within 400–900 ms across all levels", () => {
    expect(botThinkDelayMs(300, 0)).toBe(400);
    expect(botThinkDelayMs(3500, 1)).toBe(900);
    expect(botThinkDelayMs(100, 0)).toBe(400);
    expect(botThinkDelayMs(4000, 1)).toBe(900);
  });

  it("grows with bot strength", () => {
    expect(botThinkDelayMs(2400, 0.5)).toBeGreaterThan(botThinkDelayMs(600, 0.5));
  });
});
