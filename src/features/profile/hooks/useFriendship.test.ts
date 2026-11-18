import { describe, expect, it } from "vitest";
import type { FriendRequest } from "@/features/friends/types";
import { isFriendship } from "./useFriendship";

describe("isFriendship", () => {
  it("polls a profile's online status only for a friend", () => {
    expect(isFriendship({ kind: "friends" })).toBe(true);
    expect(isFriendship({ kind: "none" })).toBe(false);
    expect(isFriendship({ kind: "self" })).toBe(false);
    expect(isFriendship({ kind: "loading" })).toBe(false);
    expect(isFriendship({ kind: "request-sent", request: {} as FriendRequest })).toBe(false);
  });
});
