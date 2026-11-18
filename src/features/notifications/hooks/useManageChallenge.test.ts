import { describe, expect, it } from "vitest";
import { acceptChallengeMessage } from "./useManageChallenge";
import { upsertChallenge } from "./useChallengeMessageHandlers";
import type { Challenge } from "../types/websocket-messages";

describe("acceptChallengeMessage", () => {
  it("names the version of the challenge the player saw", () => {
    expect(acceptChallengeMessage({ challengerId: 10, version: 3 })).toEqual({
      type: "challenge_accepted",
      data: { challengerId: 10, version: 3 },
    });
    expect(acceptChallengeMessage({ challengerId: 10, version: 0 }).data).toEqual({
      challengerId: 10,
      version: 0,
    });
  });

  it("leaves it out for a challenge without one (an older server)", () => {
    expect(acceptChallengeMessage({ challengerId: 10 })).toEqual({
      type: "challenge_accepted",
      data: { challengerId: 10 },
    });
  });
});

describe("changed challenge terms", () => {
  it("replaces the shown challenge with the re-sent one, new version included", () => {
    const shown: Challenge = {
      id: 1,
      challengerId: 10,
      username: "user10",
      avatarUrl: null,
      color: "white",
      time: 180,
      increment: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      version: 1,
    };
    const changed: Challenge = { ...shown, time: 300, version: 2 };
    const [current] = upsertChallenge([shown], changed);
    expect(acceptChallengeMessage(current!).data).toEqual({ challengerId: 10, version: 2 });
  });
});
