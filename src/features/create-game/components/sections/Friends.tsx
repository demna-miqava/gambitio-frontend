import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRoundPlus, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useUserFriends } from "@/features/friends/list/hooks/useUserFriends";
import { FriendsPaginatedList } from "@/features/friends/list/components/FriendsPaginatedList";
import { FriendsLocalSearch } from "@/features/friends/list/components/FriendsLocalSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { getProfileFriendsRoute } from "@/constants/routes";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { useGameSetup } from "../../GameSetupContext";
import { OutgoingChallengeCard } from "../OutgoingChallengeCard";

const NoFriends = () => {
  const { id } = useUser();
  return (
    <EmptyState
      icon={UsersRound}
      title="No friends yet"
      description="Add friends to challenge them to a game."
      action={
        id ? (
          <Button size="lg" asChild variant="outline">
            <Link to={getProfileFriendsRoute(id)}>
              <UserRoundPlus aria-hidden="true" /> Find friends
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
};

export const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { openFriendInvite } = useGameSetup();
  const { outgoingChallenge } = useChallenges();

  const { friends, page, setPage, pagination, isLoading } = useUserFriends({
    searchQuery: debouncedSearch,
    useLocalState: true,
  });

  const hasNoFriends = !isLoading && !debouncedSearch && friends.length === 0;

  return (
    <section className="space-y-4">
      {outgoingChallenge && <OutgoingChallengeCard />}

      {hasNoFriends ? (
        <NoFriends />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Pick a friend, then choose the time control and your color.
          </p>
          <FriendsPaginatedList
            mode="pick"
            friends={friends}
            page={page}
            setPage={setPage}
            pagination={pagination}
            isLoading={isLoading}
            onChallenge={openFriendInvite}
            searchSlot={
              <FriendsLocalSearch value={searchQuery} onChange={setSearchQuery} />
            }
            emptyMessage={`No friends match “${debouncedSearch}”`}
          />
        </>
      )}
    </section>
  );
};
