import { FriendCard } from "../../components/FriendCard";
import type { Friend, FriendSuggestionActionHandlers } from "@/types";

interface SuggestedFriendsListProps extends FriendSuggestionActionHandlers {
  items: Friend[];
  emptyMessage?: string;
}

export const SuggestedFriendsList = ({
  items,
  emptyMessage = "No suggested friends",
  onAddFriend,
}: SuggestedFriendsListProps) => {
  if (items.length === 0 && emptyMessage) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((suggestion) => (
        <li key={suggestion.id}>
          <FriendCard friend={suggestion} onAddFriend={onAddFriend} />
        </li>
      ))}
    </ul>
  );
};
