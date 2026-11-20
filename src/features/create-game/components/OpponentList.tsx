import { FriendCard } from "@/features/friends/components/FriendCard";
import type { Friend, FriendOpponent } from "@/types";
import { opponentDetail, playedAgoShort } from "@/features/friends/opponents/opponentDetail";
import { useQuickChallenge } from "../hooks/useQuickChallenge";

/**
 * Friends to challenge, in the order the server lists them (online first,
 * then most recently played). After your first challenge each row sends the
 * same terms again in one tap, with a second button for the full form;
 * before it, Challenge opens the form.
 */
export const OpponentList = ({
  friends,
  onOptions,
}: {
  friends: FriendOpponent[];
  /** Open the challenge form for a friend */
  onOptions: (friend: Friend) => void;
}) => {
  const quick = useQuickChallenge();
  const quickChallenge = quick.label ? { label: quick.label, onSend: quick.send } : undefined;

  return (
    <ul className="space-y-2">
      {friends.map((friend) => (
        <li key={friend.id} className="min-w-0">
          <FriendCard
            mode="pick"
            friend={friend}
            presence={friend.status ? { ...friend, status: friend.status } : null}
            secondaryText={
              // The buttons leave room for a few words: when you last
              // played, and "Friends since" only where the row is wide
              playedAgoShort(friend.lastPlayedAt) ?? (
                <span className="hidden @sm:inline">{opponentDetail(friend)}</span>
              )
            }
            onChallenge={onOptions}
            quickChallenge={quickChallenge}
            isChallenged={quick.waitingForId === friend.id}
          />
        </li>
      ))}
    </ul>
  );
};
