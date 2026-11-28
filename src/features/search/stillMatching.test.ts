import { describe, expect, it } from "vitest";
import { stillMatching } from "./stillMatching";

const players = [{ username: "alice" }, { username: "Alicia_K" }, { username: "malice99" }];

describe("stillMatching", () => {
  it("keeps the earlier matches that the longer text still matches", () => {
    expect(stillMatching(players, "alic").map((p) => p.username)).toEqual(["alice", "Alicia_K", "malice99"]);
    expect(stillMatching(players, "alice").map((p) => p.username)).toEqual(["alice", "malice99"]);
    expect(stillMatching(players, "ALICI").map((p) => p.username)).toEqual(["Alicia_K"]);
  });

  it("shows none of the last search's players for a different one", () => {
    expect(stillMatching(players, "bob")).toEqual([]);
    expect(stillMatching(players, "b")).toEqual([]);
  });
});
