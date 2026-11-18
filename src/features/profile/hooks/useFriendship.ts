import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "@/services/user";
import { QKEY_USER_FRIENDS } from "@/constants/queryKeys";
import { useUser } from "@/hooks/useUser";
import { usePendingFriendRequests } from "@/features/friends/requests/hooks/usePendingFriendRequests";
import type { FriendRequest } from "@/features/friends/types";

export type FriendshipStatus =
  | { kind: "loading" }
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "friends" }
  | { kind: "request-sent"; request: FriendRequest }
  | { kind: "request-received"; request: FriendRequest };

/**
 * Whether the player is a friend: only then is their online status known,
 * and worth polling for (not while loading, nor for a stranger or yourself).
 */
export const isFriendship = (status: FriendshipStatus): boolean => status.kind === "friends";

/**
 * How the signed-in user relates to another player. There's no endpoint for
 * this, so it's read from the user's own friend list (searched by the
 * player's name) and their pending requests. The lookup's key starts with
 * QKEY_USER_FRIENDS, so adding or removing a friend refreshes it.
 */
export const useFriendship = (profile?: { id: number; username: string }) => {
  const { id: currentUserId } = useUser();
  const isSelf = !!profile && profile.id === currentUserId;
  const enabled = !!profile && !!currentUserId && !isSelf;

  const friendLookup = useQuery({
    queryKey: [QKEY_USER_FRIENDS, currentUserId, "lookup", profile?.username],
    queryFn: () =>
      getUserFriends(
        currentUserId!,
        // The search is a substring match, so take the most the API allows
        // (100) to be sure the exact name is in it
        new URLSearchParams({ q: profile!.username, page: "1", limit: "100" }).toString()
      ),
    enabled,
  });
  const pending = usePendingFriendRequests();

  let status: FriendshipStatus;
  if (!profile) status = { kind: "loading" };
  else if (isSelf) status = { kind: "self" };
  else if (friendLookup.isPending || pending.isPending) status = { kind: "loading" };
  else if (friendLookup.data?.data.some((friend) => friend.id === profile.id)) {
    status = { kind: "friends" };
  } else {
    // The request ids come back as strings
    const id = String(profile.id);
    const sent = pending.sentRequests.find((r) => String(r.receiverId) === id);
    const received = pending.receivedRequests.find((r) => String(r.senderId) === id);
    status = sent
      ? { kind: "request-sent", request: sent }
      : received
        ? { kind: "request-received", request: received }
        : { kind: "none" };
  }

  return status;
};
