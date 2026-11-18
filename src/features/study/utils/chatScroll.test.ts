import { describe, expect, it } from "vitest";
import { isNearBottom } from "./chatScroll";

describe("isNearBottom", () => {
  it("is at the bottom when the end of the list is in view", () => {
    expect(isNearBottom({ scrollHeight: 500, clientHeight: 200, scrollTop: 300 })).toBe(true);
    expect(isNearBottom({ scrollHeight: 500, clientHeight: 200, scrollTop: 280 })).toBe(true);
    // A list that doesn't scroll
    expect(isNearBottom({ scrollHeight: 100, clientHeight: 200, scrollTop: 0 })).toBe(true);
  });

  it("isn't when the reader has scrolled up", () => {
    expect(isNearBottom({ scrollHeight: 500, clientHeight: 200, scrollTop: 100 })).toBe(false);
  });
});
