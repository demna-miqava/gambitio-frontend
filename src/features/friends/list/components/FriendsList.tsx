import type { ReactNode } from "react";
import { UsersRound } from "lucide-react";
import { FriendCard, type FriendCardMode } from "../../components/FriendCard";
import type { Friend, FriendActionHandlers } from "@/types";
import { useFriendStatuses } from "../../status/useFriendStatuses";
import { EmptyState } from "@/components/EmptyState";
import { formatShortDate } from "@/lib/utils";

interface FriendsListProps extends FriendActionHandlers {
  items: Friend[];
  /** Shown when there are no items; a string becomes the empty state's title */
  emptyMessage?: ReactNode;
  currentUserId?: number;
  isOwnProfile?: boolean;
  mode?: FriendCardMode;
  /** The line under each name; "Friends since …" by default */
  secondaryTextFor?: (friend: Friend) => ReactNode;
}

export const FriendsList = ({
  items,
  emptyMessage = "No friends yet",
  onChallenge,
  onRemove,
  currentUserId,
  isOwnProfile,
  mode,
  secondaryTextFor = (friend) => `Friends since ${formatShortDate(friend.friendsSince)}`,
}: FriendsListProps) => {
  // Known for the signed-in user's own friends only; on someone else's
  // profile that's the friends you have in common
  const { byId: statuses } = useFriendStatuses();

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
            presence={statuses.get(friend.id)}
            secondaryText={secondaryTextFor(friend)}
          />
        </li>
      ))}
    </ul>
  );
};
