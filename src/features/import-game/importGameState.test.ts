import { describe, expect, it } from "vitest";
import { readImportGameState } from "./importGameState";

describe("readImportGameState", () => {
  it("reads a PGN and the review flag", () => {
    expect(readImportGameState({ pgn: "1. e4 e5", review: true })).toEqual({ pgn: "1. e4 e5", review: true });
    expect(readImportGameState({ pgn: "1. e4 e5" })).toEqual({ pgn: "1. e4 e5", review: false });
  });

  it("ignores missing, empty or malformed state", () => {
    expect(readImportGameState(null)).toBeNull();
    expect(readImportGameState(undefined)).toBeNull();
    expect(readImportGameState("1. e4")).toBeNull();
    expect(readImportGameState({ pgn: "   " })).toBeNull();
    expect(readImportGameState({ pgn: 42, review: true })).toBeNull();
    expect(readImportGameState({ pgn: "1. e4", review: "yes" })).toEqual({ pgn: "1. e4", review: false });
  });
});
