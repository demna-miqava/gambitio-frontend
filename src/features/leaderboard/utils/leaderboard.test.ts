import { describe, expect, it } from "vitest";
import {
  entryLabel,
  parsePage,
  parseScope,
  parseVariant,
  pinnedEntry,
  podiumTier,
  variantLabel,
} from "./leaderboard";
import type { LeaderboardEntry } from "../types";

const entry = (id: number, rank: number): LeaderboardEntry => ({
  id,
  rank,
  username: `user${id}`,
  avatarUrl: null,
  rating: 2000 - rank,
  highestRating: 2000,
  gamesPlayed: 3,
});

describe("URL parsing", () => {
  it("accepts known variants and falls back to blitz", () => {
    expect(parseVariant("bullet")).toBe("bullet");
    expect(parseVariant("rapid")).toBe("rapid");
    expect(parseVariant("classical")).toBe("blitz");
    expect(parseVariant(null)).toBe("blitz");
  });

  it("defaults the scope to global", () => {
    expect(parseScope("friends")).toBe("friends");
    expect(parseScope("everyone")).toBe("global");
    expect(parseScope(null)).toBe("global");
  });

  it("only accepts positive whole pages", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(null)).toBe(1);
  });

  it("labels variants", () => {
    expect(variantLabel("blitz")).toBe("Blitz");
  });
});

describe("podiumTier", () => {
  it("gives medals to ranks 1-3 only", () => {
    expect([1, 2, 3, 4].map(podiumTier)).toEqual(["gold", "silver", "bronze", null]);
  });
});

describe("pinnedEntry", () => {
  const me = { ...entry(7, 42), page: 2 };

  it("pins the user's row when it's on another page", () => {
    expect(pinnedEntry({ data: [entry(1, 1), entry(2, 2)], me })).toBe(me);
  });

  it("doesn't pin when the row is already listed", () => {
    expect(pinnedEntry({ data: [entry(1, 1), entry(7, 42)], me })).toBeNull();
  });

  it("doesn't pin unranked users or before data loads", () => {
    expect(pinnedEntry({ data: [entry(1, 1)], me: null })).toBeNull();
    expect(pinnedEntry(undefined)).toBeNull();
  });
});

describe("entryLabel", () => {
  it("reads rank, name and rating", () => {
    expect(entryLabel(entry(1, 1), false)).toBe("Rank 1, user1, 1999 rating");
    expect(entryLabel(entry(1, 1), true)).toBe("Rank 1, user1 (you), 1999 rating");
  });
});
