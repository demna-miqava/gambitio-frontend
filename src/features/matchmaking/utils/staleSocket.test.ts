import { describe, expect, it } from "vitest";
import { isCurrentSearchSocket } from "./staleSocket";

const a = { name: "a" };
const b = { name: "b" };

describe("isCurrentSearchSocket", () => {
  it("accepts the current socket of a running search", () => {
    expect(isCurrentSearchSocket({ previousSocket: null }, a, a)).toBe(true);
    expect(isCurrentSearchSocket({ previousSocket: a }, b, b)).toBe(true);
  });

  it("ignores closes when no search is running (cancelled or finished)", () => {
    expect(isCurrentSearchSocket(null, a, a)).toBe(false);
  });

  it("ignores the previous search's socket before the new one exists", () => {
    // Cancel then search again: the old socket is still the library's current one
    expect(isCurrentSearchSocket({ previousSocket: a }, a, a)).toBe(false);
  });

  it("ignores a socket that was replaced by a newer one", () => {
    expect(isCurrentSearchSocket({ previousSocket: null }, a, b)).toBe(false);
  });
});
