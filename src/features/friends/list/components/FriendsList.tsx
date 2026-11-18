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
  // Known for the signed-in user's own friends only; on someone else's
  // profile that's the friends you have in common. Not polled for an empty list
  const { byId: statuses } = useFriendStatuses({ enabled: items.length > 0 });

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
            secondaryText={`Friends since ${formatShortDate(friend.friendsSince)}`}
          />
        </li>
      ))}
    </ul>
  );
};
