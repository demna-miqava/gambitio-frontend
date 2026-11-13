import { useSuggestedFriends } from "../hooks/useSuggestedFriends";
import { SuggestedFriendsList } from "./SuggestedFriendsList";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useFriendActions } from "../../hooks/useFriendActions";
import { SectionHeader } from "@/components/PageHeader";

/** Players matching the friends search who aren't friends yet. */
export const SuggestedFriends = () => {
  const { onAddFriend } = useFriendActions();
  const [search] = useQueryParams("search", "");
  const { suggestions } = useSuggestedFriends(search);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <SectionHeader title="Other players" />
        <p className="text-sm text-muted-foreground">
          Players matching “{search}” who aren't your friends yet.
        </p>
      </div>
      <SuggestedFriendsList
        items={suggestions}
        emptyMessage=""
        onAddFriend={onAddFriend}
      />
    </section>
  );
};
