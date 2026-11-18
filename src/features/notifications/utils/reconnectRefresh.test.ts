import { describe, expect, it } from "vitest";
import {
  QKEY_ACTIVE_GAME,
  QKEY_CHALLENGES,
  QKEY_FRIEND_STATUSES,
  QKEY_GAME_BY_ID,
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_TABLE_GAME_REQUESTS,
  QKEY_USER_FRIENDS,
} from "@/constants/queryKeys";
import { mayBeStaleAfterReconnect } from "./reconnectRefresh";

describe("mayBeStaleAfterReconnect", () => {
  it("refreshes challenges and the active game", () => {
    expect(mayBeStaleAfterReconnect([QKEY_CHALLENGES], 7)).toBe(true);
    expect(mayBeStaleAfterReconnect([QKEY_ACTIVE_GAME], 7)).toBe(true);
  });

  it("refreshes which friends are online", () => {
    expect(mayBeStaleAfterReconnect([QKEY_FRIEND_STATUSES], 7)).toBe(true);
  });

  it("refreshes table games waiting to be confirmed (a request may have come while offline)", () => {
    expect(mayBeStaleAfterReconnect([QKEY_TABLE_GAME_REQUESTS], 7)).toBe(true);
  });

  it("refreshes only the signed-in player's own friend lists", () => {
    expect(mayBeStaleAfterReconnect([QKEY_PENDING_FRIEND_REQUESTS, 7], 7)).toBe(true);
    expect(mayBeStaleAfterReconnect([QKEY_USER_FRIENDS, 7, 1, 20, ""], 7)).toBe(true);
    expect(mayBeStaleAfterReconnect([QKEY_USER_FRIENDS, 9, 1, 20, ""], 7)).toBe(false);
    expect(mayBeStaleAfterReconnect([QKEY_USER_FRIENDS, 7], undefined)).toBe(false);
  });

  it("leaves everything else alone", () => {
    expect(mayBeStaleAfterReconnect([QKEY_GAME_BY_ID, "12"], 7)).toBe(false);
  });
});
