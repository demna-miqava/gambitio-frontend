import { describe, expect, it } from "vitest";
import { wrongMoveShapes } from "./wrongMoveMark";

describe("wrongMoveShapes", () => {
  it("tints the square under the piece and puts a badge over it", () => {
    const [tint, badge] = wrongMoveShapes("e5");
    expect(tint).toMatchObject({ orig: "e5", below: true });
    expect(badge.orig).toBe("e5");
    expect(badge.below).toBeUndefined();
    expect(badge.customSvg?.html).toContain("<path");
  });
});
