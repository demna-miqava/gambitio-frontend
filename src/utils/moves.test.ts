import { describe, expect, it } from "vitest";
import { fullMoves } from "./moves";

describe("fullMoves", () => {
  it("counts a white move without a reply as a full move", () => {
    expect(fullMoves(0)).toBe(0);
    expect(fullMoves(1)).toBe(1);
    expect(fullMoves(2)).toBe(1);
    expect(fullMoves(65)).toBe(33);
    expect(fullMoves(66)).toBe(33);
  });
});
