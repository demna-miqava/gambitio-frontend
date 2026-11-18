import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  QKEY_FRIEND_STATUSES,
  QKEY_USER_FRIENDS,
  QKEY_USER_PROFILE,
} from "@/constants/queryKeys";
import { invalidateAfterBlockChange } from "@/features/moderation/hooks/useBlocks";
import { invalidateAfterFriendshipChange } from "./friendshipQueries";

const invalidatedKeys = (run: (client: QueryClient) => void) => {
  const client = new QueryClient();
  const spy = vi.spyOn(client, "invalidateQueries");
  run(client);
  return spy.mock.calls.map(([filters]) => filters?.queryKey?.[0]);
};

describe("invalidateAfterFriendshipChange", () => {
  it("refreshes who is online with the friend lists and counts", () => {
    const keys = invalidatedKeys(invalidateAfterFriendshipChange);
    expect(keys).toContain(QKEY_FRIEND_STATUSES);
    expect(keys).toContain(QKEY_USER_FRIENDS);
    expect(keys).toContain(QKEY_USER_PROFILE);
  });
});

describe("invalidateAfterBlockChange", () => {
  it("drops a blocked friend from the Online lists", () => {
    expect(invalidatedKeys(invalidateAfterBlockChange)).toContain(QKEY_FRIEND_STATUSES);
  });
});
