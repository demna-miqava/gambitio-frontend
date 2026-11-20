import { describe, expect, it } from "vitest";
import {
  extraOptionsSummary,
  planChallenge,
  planQuickChallenge,
  quickChallengeSummary,
  ratingHint,
  type ChallengeForm,
} from "./challengePlan";

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

  it("says why a challenge with time odds is unrated", () => {
    expect(hint({ odds: "them" })).toBe("Games with time odds are unrated.");
  });
});

describe("extraOptionsSummary", () => {
  it("is empty for a plain single game, whatever the rating and colour", () => {
    expect(extraOptionsSummary(planChallenge(form()), null)).toEqual([]);
    expect(extraOptionsSummary(planChallenge(form({ rating: "unrated", color: "black" })), null)).toEqual([]);
  });

  it("names the format, in each of its forms", () => {
    expect(extraOptionsSummary(planChallenge(form({ format: "mirror" })), null)).toEqual(["Mirror match"]);
    expect(extraOptionsSummary(planChallenge(form({ format: "series", seriesLength: "5" })), null)).toEqual(["Best of 5"]);
    expect(extraOptionsSummary(planChallenge(form({ format: "timed", matchMinutes: 30 })), null)).toEqual([
      "30-minute match",
    ]);
  });

  it("lists time odds, the format and the opening in the form's order", () => {
    const plan = planChallenge(form({ time: 300, odds: "me", format: "mirror", openingId: "queens-gambit" }));
    expect(plan.hasOdds).toBe(true);
    const summary = extraOptionsSummary(plan, "Queen's Gambit");
    expect(summary).toHaveLength(3);
    expect(summary[0]).toContain(" vs ");
    expect(summary.slice(1)).toEqual(["Mirror match", "Queen's Gambit"]);
  });

  it("leaves time odds out when the time control has no shorter clock", () => {
    const plan = planChallenge(form({ time: 15, odds: "them" }));
    expect(plan.hasOdds).toBe(false);
    expect(extraOptionsSummary(plan, null)).toEqual([]);
  });
});

describe("planQuickChallenge", () => {
  it("sends a single game on the last challenge's terms", () => {
    expect(planQuickChallenge(12, { time: 300, increment: 0, color: "random", rated: true })).toEqual({
      challengedId: 12,
      color: "random",
      time: 300,
      increment: 0,
      bestOf: 1,
    });
    expect(planQuickChallenge(7, { time: 600, increment: 5, color: "black", rated: false })).toEqual({
      challengedId: 7,
      color: "black",
      time: 600,
      increment: 5,
      bestOf: 1,
      rated: false,
    });
  });

  it("says what it sends", () => {
    expect(quickChallengeSummary({ time: 300, increment: 0, color: "random", rated: true })).toBe(
      "5+0 · Rated · Random colors"
    );
    expect(quickChallengeSummary({ time: 180, increment: 2, color: "white", rated: false })).toBe(
      "3+2 · Unrated · You play white"
    );
  });
});
