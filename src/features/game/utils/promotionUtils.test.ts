import { describe, expect, it } from "vitest";
import {
  calculatePromotionPosition,
  shouldReversePromotionOrder,
} from "./promotionUtils";

describe("promotion picker placement", () => {
  it("keeps queen-first order when promoting toward the top edge", () => {
    expect(shouldReversePromotionOrder("white", "white")).toBe(false);
    expect(shouldReversePromotionOrder("black", "black")).toBe(false);
    expect(calculatePromotionPosition("a8", "white")).toEqual({ left: "0%", top: "0%" });
    expect(calculatePromotionPosition("a1", "black")).toEqual({ left: "87.5%", top: "0%" });
  });

  it("anchors to the bottom and reverses when the board is flipped", () => {
    expect(shouldReversePromotionOrder("black", "white")).toBe(true);
    expect(calculatePromotionPosition("h1", "white")).toEqual({ left: "87.5%", bottom: "0%" });
    expect(calculatePromotionPosition("h8", "black")).toEqual({ left: "0%", bottom: "0%" });
  });
});
