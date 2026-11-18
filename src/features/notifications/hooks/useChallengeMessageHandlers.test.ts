import { describe, expect, it } from "vitest";
import { challengeFromMessage, upsertChallenge } from "./useChallengeMessageHandlers";
import { describeMatchFormat } from "../utils/challengeLabels";
import type { Challenge } from "../types/websocket-messages";

const challenge = (id: number, challengerId: number): Challenge => ({
  id,
  challengerId,
  username: `user${challengerId}`,
  avatarUrl: null,
  color: "white",
  time: 180,
  increment: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("upsertChallenge", () => {
  it("adds a new challenge", () => {
    expect(upsertChallenge([challenge(1, 10)], challenge(2, 20))).toEqual([
      challenge(1, 10),
      challenge(2, 20),
    ]);
  });

  it("ignores a repeated message for the same challenge", () => {
    expect(upsertChallenge([challenge(1, 10)], challenge(1, 10))).toEqual([
      challenge(1, 10),
    ]);
  });

  it("replaces an older challenge from the same challenger", () => {
    expect(upsertChallenge([challenge(1, 10), challenge(2, 20)], challenge(3, 10))).toEqual([
      challenge(2, 20),
      challenge(3, 10),
    ]);
  });
});

describe("challengeFromMessage", () => {
  const data = {
    id: 1,
    challengerId: 10,
    username: "user10",
    avatarUrl: null,
    color: "white" as const,
    time: 180,
    increment: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("keeps the series a challenge continues, so the toast names the game", () => {
    const continued = challengeFromMessage({ ...data, bestOf: 2, seriesId: 5, seriesGame: 2 });
    expect(continued).toMatchObject({ seriesId: 5, seriesGame: 2 });
    expect(describeMatchFormat(continued.bestOf, continued.seriesGame)).toBe("Mirror match, game 2");
  });

  it("keeps the new terms, and leaves the series empty for a new challenge", () => {
    const fresh = challengeFromMessage({
      ...data,
      bestOf: 3,
      rated: false,
      opening: { id: "sicilian", eco: "B20", name: "Sicilian Defense" },
      matchMinutes: null,
      version: 4,
    });
    expect(fresh).toMatchObject({
      seriesId: null,
      seriesGame: null,
      rated: false,
      opening: { name: "Sicilian Defense" },
      version: 4,
    });
  });
});
