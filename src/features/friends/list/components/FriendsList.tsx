import type { ReactNode } from "react";
import { UsersRound } from "lucide-react";
import { FriendCard, type FriendCardMode } from "../../components/FriendCard";
import type { Friend, FriendActionHandlers } from "@/types";
import { useFriendLiveGameIds } from "@/features/watch/hooks/useLiveGames";
import { EmptyState } from "@/components/EmptyState";
import { formatShortDate } from "@/lib/utils";

interface FriendsListProps extends FriendActionHandlers {
  items: Friend[];
  /** Shown when there are no items; a string becomes the empty state's title */
  emptyMessage?: ReactNode;
  currentUserId?: number;
  isOwnProfile?: boolean;
  mode?: FriendCardMode;
}

export const FriendsList = ({
  items,
  emptyMessage = "No friends yet",
  onChallenge,
  onRemove,
  currentUserId,
  isOwnProfile,
  mode,
}: FriendsListProps) => {
  // Friends playing right now get a "Watch" link (not when picking whom to challenge)
  const liveGameIds = useFriendLiveGameIds({ enabled: mode !== "pick" });

  if (items.length === 0 && emptyMessage) {
    return typeof emptyMessage === "string" ? (
      <EmptyState icon={UsersRound} title={emptyMessage} />
    ) : (
      emptyMessage
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((friend) => (
        <li key={friend.id}>
          <FriendCard
            friend={friend}
            onChallenge={onChallenge}
            onRemove={onRemove}
            currentUserId={currentUserId}
            isOwnProfile={isOwnProfile}
            mode={mode}
            liveGameId={mode === "pick" ? null : liveGameIds.get(friend.id)}
            secondaryText={`Friends since ${formatShortDate(friend.friendsSince)}`}
          />
        </li>
      ))}
    </ul>
  );
};
