import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { parseTypedMove } from "./parseTypedMove";

describe("parseTypedMove", () => {
  it("reads SAN", () => {
    const chess = new Chess();
    expect(parseTypedMove(chess, "e4")).toEqual({ from: "e2", to: "e4" });
    expect(parseTypedMove(chess, " Nf3 ")).toEqual({ from: "g1", to: "f3" });
  });

  it("reads coordinates", () => {
    const chess = new Chess();
    expect(parseTypedMove(chess, "e2e4")).toEqual({ from: "e2", to: "e4" });
    expect(parseTypedMove(chess, "g1-f3")).toEqual({ from: "g1", to: "f3" });
  });

  it("accepts lowercase SAN when it's unambiguous", () => {
    const chess = new Chess();
    expect(parseTypedMove(chess, "nf3")).toEqual({ from: "g1", to: "f3" });
  });

  it("rejects illegal or unknown moves", () => {
    const chess = new Chess();
    expect(parseTypedMove(chess, "e5")).toBeNull();
    expect(parseTypedMove(chess, "e2e5")).toBeNull();
    expect(parseTypedMove(chess, "hello")).toBeNull();
    expect(parseTypedMove(chess, "")).toBeNull();
  });

  it("ignores check marks and reads castling", () => {
    const chess = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(parseTypedMove(chess, "O-O")).toEqual({ from: "e1", to: "g1" });
    expect(parseTypedMove(chess, "0-0-0")).toEqual({ from: "e1", to: "c1" });
    expect(parseTypedMove(chess, "Rxa8+")).toEqual({ from: "a1", to: "a8" });
  });

  it("handles promotions", () => {
    const chess = new Chess("8/P7/8/8/8/8/8/k6K w - - 0 1");
    expect(parseTypedMove(chess, "a8=Q")).toEqual({ from: "a7", to: "a8", promotion: "q" });
    expect(parseTypedMove(chess, "a8n")).toEqual({ from: "a7", to: "a8", promotion: "n" });
    expect(parseTypedMove(chess, "a7a8r")).toEqual({ from: "a7", to: "a8", promotion: "r" });
    // Coordinates without a piece promote to a queen
    expect(parseTypedMove(chess, "a7a8")).toEqual({ from: "a7", to: "a8", promotion: "q" });
  });
});
