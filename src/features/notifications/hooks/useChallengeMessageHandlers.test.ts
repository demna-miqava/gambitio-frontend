import { describe, expect, it } from "vitest";
import { upsertChallenge } from "./useChallengeMessageHandlers";
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
