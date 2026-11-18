import { describe, expect, it } from "vitest";
import type { StartingOpening } from "@/features/openings/startingOpenings";
import { NO_OPENING, startingOpeningFor } from "./openingChoice";

const sicilian: StartingOpening = {
  id: "sicilian",
  eco: "B20",
  name: "Sicilian Defense",
  moves: ["e4", "c5"],
  fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
};

describe("startingOpeningFor", () => {
  it("keeps the opening on the form of the friend it was picked for", () => {
    expect(startingOpeningFor({ friendId: 7, opening: sicilian }, 7)).toBe(sicilian);
  });

  it("starts the next friend's form from the standard position", () => {
    expect(startingOpeningFor({ friendId: 7, opening: sicilian }, 8)).toBeNull();
  });

  it("has none off the form (the friends list) or before any is picked", () => {
    expect(startingOpeningFor({ friendId: 7, opening: sicilian }, null)).toBeNull();
    expect(startingOpeningFor(NO_OPENING, 7)).toBeNull();
  });
});
