import { describe, expect, it } from "vitest";
import { planChallenge, ratingHint, type ChallengeForm } from "./challengePlan";

const form = (overrides: Partial<ChallengeForm> = {}): ChallengeForm => ({
  friendId: 12,
  color: "random",
  time: 300,
  increment: 0,
  format: "single",
  seriesLength: "3",
  matchMinutes: 15,
  odds: "even",
  pickedClock: null,
  rating: "rated",
  openingId: null,
  ...overrides,
});

describe("planChallenge", () => {
  it("sends a plain rated game with nothing it doesn't need", () => {
    expect(planChallenge(form()).data).toEqual({
      challengedId: 12,
      color: "random",
      time: 300,
      increment: 0,
      bestOf: 1,
    });
  });

  it("sends the player's Unrated choice", () => {
    const plan = planChallenge(form({ rating: "unrated" }));
    expect(plan.rated).toBe(false);
    expect(plan.forcedUnrated).toBeNull();
    expect(plan.data.rated).toBe(false);
  });

  it("never sends a rated game with time odds", () => {
    const plan = planChallenge(form({ odds: "them", pickedClock: 60 }));
    expect(plan.forcedUnrated).toBe("odds");
    expect(plan.data).toMatchObject({ time: 300, opponentTime: 60, rated: false });
    expect(planChallenge(form({ odds: "me", pickedClock: 60 })).data).toMatchObject({
      time: 60,
      opponentTime: 300,
    });
  });

  it("drops a picked odds clock that no longer fits, and odds with no shorter clock", () => {
    expect(planChallenge(form({ odds: "me", pickedClock: 240, time: 180 })).ownTime).toBe(90);
    const shortest = planChallenge(form({ odds: "me", time: 15 }));
    expect(shortest.hasOdds).toBe(false);
    expect(shortest.data).not.toHaveProperty("opponentTime");
  });

  it("makes a game, series or timed match from an opening unrated", () => {
    for (const format of ["single", "series", "timed"] as const) {
      const plan = planChallenge(form({ format, openingId: "sicilian" }));
      expect(plan.forcedUnrated).toBe("opening");
      expect(plan.data).toMatchObject({ rated: false, openingId: "sicilian" });
    }
  });

  it("leaves a mirror match from an opening rated (or not) by choice", () => {
    const rated = planChallenge(form({ format: "mirror", openingId: "sicilian" }));
    expect(rated.forcedUnrated).toBeNull();
    expect(rated.data).toEqual(expect.not.objectContaining({ rated: false }));
    expect(rated.data).toMatchObject({ bestOf: 2, openingId: "sicilian" });
    expect(planChallenge(form({ format: "mirror", openingId: "sicilian", rating: "unrated" })).data.rated).toBe(
      false
    );
  });

  it("sends a timed match as bestOf 1 with its minutes, and only then", () => {
    const timed = planChallenge(form({ format: "timed", seriesLength: "5", matchMinutes: 20 }));
    expect(timed.data).toMatchObject({ bestOf: 1, matchMinutes: 20 });
    expect(timed.isMatch).toBe(true);
    expect(planChallenge(form({ format: "series", seriesLength: "5", matchMinutes: 20 })).data).toEqual(
      expect.not.objectContaining({ matchMinutes: expect.anything() })
    );
    expect(planChallenge(form({ format: "series", seriesLength: "5" })).data.bestOf).toBe(5);
    expect(planChallenge(form({ format: "mirror" })).data.bestOf).toBe(2);
  });

  it("says when a game doesn't fit in a timed match", () => {
    expect(planChallenge(form({ format: "timed", time: 600, matchMinutes: 15 })).fitsMatch).toBe(false);
    expect(planChallenge(form({ format: "timed", time: 180, matchMinutes: 15 })).fitsMatch).toBe(true);
    // Only timed matches have a length to fit in
    expect(planChallenge(form({ time: 5400 })).fitsMatch).toBe(true);
  });
});

describe("ratingHint", () => {
  const hint = (overrides: Partial<ChallengeForm>) => ratingHint(planChallenge(form(overrides)));

  it("says nothing for a rated challenge", () => {
    expect(hint({})).toBeNull();
  });

  it("calls a mirror match a match, not a series", () => {
    expect(hint({ format: "mirror", rating: "unrated" })).toBe("No game of the match changes either player's rating.");
    expect(hint({ format: "timed", rating: "unrated" })).toBe("No game of the match changes either player's rating.");
    expect(hint({ format: "series", rating: "unrated" })).toBe("No game of the series changes either player's rating.");
    expect(hint({ rating: "unrated" })).toBe("The game doesn't change either player's rating.");
  });

  it("says why a challenge from an opening is unrated", () => {
    expect(hint({ openingId: "sicilian" })).toMatch(/chosen opening are unrated/);
  });
});
