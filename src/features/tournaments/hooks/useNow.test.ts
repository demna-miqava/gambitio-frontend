import { describe, expect, it } from "vitest";
import { keepsTicking } from "./useNow";

describe("keepsTicking", () => {
  it("ticks until the moment, then stops", () => {
    expect(keepsTicking(1_000, 2_000)).toBe(true);
    expect(keepsTicking(2_000, 2_000)).toBe(false);
    expect(keepsTicking(3_000, 2_000)).toBe(false);
  });

  it("ticks for good without one", () => {
    expect(keepsTicking(3_000)).toBe(true);
    expect(keepsTicking(3_000, null)).toBe(true);
    expect(keepsTicking(3_000, Number.NaN)).toBe(true);
  });
});
