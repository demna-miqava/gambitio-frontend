import { describe, expect, it } from "vitest";
import type { ProfileStatusResponse } from "@/services/user";
import { formatRatingChange, withPuzzleRating } from "./puzzleRating";

describe("formatRatingChange", () => {
  it("signs the change", () => {
    expect(formatRatingChange(12)).toBe("+12");
    expect(formatRatingChange(-8)).toBe("−8");
    expect(formatRatingChange(0)).toBe("±0");
  });
});

describe("withPuzzleRating", () => {
  const result = { puzzleRating: 1512, highestPuzzleRating: 1530 };

  it("updates the cached user's puzzle ratings only", () => {
    const status = {
      hasProfile: true,
      user: { id: 1, username: "a", blitzRating: 1000, puzzleRating: 1500 },
    } as unknown as ProfileStatusResponse;
    const next = withPuzzleRating(status, result);
    expect(next?.user).toMatchObject({ id: 1, blitzRating: 1000, puzzleRating: 1512, highestPuzzleRating: 1530 });
    expect(status.user).toMatchObject({ puzzleRating: 1500 }); // not mutated
  });

  it("leaves an unloaded or profile-less status alone", () => {
    expect(withPuzzleRating(undefined, result)).toBeUndefined();
    const none = { hasProfile: false, user: null };
    expect(withPuzzleRating(none, result)).toBe(none);
  });
});
