import { describe, expect, it } from "vitest";
import type { FriendStatus } from "@/types";
import { inStableOrder, sameIds } from "./onlineFilter";

const friend = (id: number, status: FriendStatus["status"] = "online"): FriendStatus => ({
  id,
  username: `user${id}`,
  avatarUrl: "",
  friendsSince: "2026-01-01T00:00:00.000Z",
  blitzRating: 1500,
  bulletRating: 1500,
  rapidRating: 1500,
  status,
  gameId: status === "playing" ? 100 + id : null,
  gameType: status === "playing" ? "blitz" : null,
});

const ids = (statuses: FriendStatus[]) => statuses.map((status) => status.id);

describe("inStableOrder", () => {
  it("takes the server's order the first time", () => {
    expect(ids(inStableOrder([], [friend(1), friend(2), friend(3, "playing")]))).toEqual([1, 2, 3]);
  });

  it("keeps a friend in place when they start a game (the server moves them to the end)", () => {
    const next = inStableOrder([1, 2, 3], [friend(2), friend(3), friend(1, "playing")]);
    expect(ids(next)).toEqual([1, 2, 3]);
    // With their new status
    expect(next[0].status).toBe("playing");
  });

  it("drops friends who went offline and adds new ones after the rest", () => {
    expect(ids(inStableOrder([1, 2, 3], [friend(4), friend(3), friend(1)]))).toEqual([1, 3, 4]);
  });
});

describe("sameIds", () => {
  it("compares order too", () => {
    expect(sameIds([1, 2], [1, 2])).toBe(true);
    expect(sameIds([1, 2], [2, 1])).toBe(false);
    expect(sameIds([1], [1, 2])).toBe(false);
  });
});
