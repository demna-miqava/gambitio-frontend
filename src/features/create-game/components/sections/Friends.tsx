import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRoundPlus, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useFriendOpponents } from "@/features/friends/opponents/useFriendOpponents";
import { FriendsListSkeleton } from "@/features/friends/list/components/FriendsListSkeleton";
import { FriendsLocalSearch } from "@/features/friends/list/components/FriendsLocalSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { getProfileFriendsRoute } from "@/constants/routes";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { useGameSetup } from "../../GameSetupContext";
import { useQuickChallenge } from "../../hooks/useQuickChallenge";
import { OutgoingChallengeCard } from "../OutgoingChallengeCard";
import { OpponentList } from "../OpponentList";

const PAGE_SIZE = 20;

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

/** What a tap on a friend does: sends the last challenge again, or (before the first one) opens the form */
const QuickChallengeHint = () => {
  const { summary } = useQuickChallenge();
  return (
    <p className="text-sm text-muted-foreground">
      {summary ? (
        <>
          One tap sends <span className="text-foreground tabular-nums">{summary}</span>.
        </>
      ) : (
        "Pick a friend, then choose the time control and your color."
      )}
    </p>
  );
};

/** The friends to challenge: online first, then the ones you played last. */
export const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300).trim();
  // A page number belongs to the search it was picked in
  const [{ page, search }, setShown] = useState({ page: 1, search: "" });
  if (search !== debouncedSearch) setShown({ page: 1, search: debouncedSearch });
  const setPage = (next: number) => setShown({ page: next, search });
  const { openFriendInvite } = useGameSetup();
  const { outgoingChallenge } = useChallenges();

  const { friends, pagination, isLoading, isError, refetch } = useFriendOpponents({
    page,
    limit: PAGE_SIZE,
    search,
  });
  const totalPages = pagination?.totalPages ?? 1;
  const hasNoFriends = !isLoading && !isError && !search && friends.length === 0;

  return (
    <section className="space-y-4">
      {outgoingChallenge && <OutgoingChallengeCard />}

      {hasNoFriends ? (
        <NoFriends />
      ) : (
        <>
          <QuickChallengeHint />
          <FriendsLocalSearch value={searchQuery} onChange={setSearchQuery} />
          {isLoading ? (
            <FriendsListSkeleton mode="pick" />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">Couldn't load your friends.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : friends.length === 0 ? (
            <EmptyState icon={UsersRound} title={`No friends match “${search}”`} />
          ) : (
            <OpponentList friends={friends} onOptions={openFriendInvite} />
          )}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              hasNextPage={page < totalPages}
              hasPreviousPage={page > 1}
            />
          )}
        </>
      )}
    </section>
  );
};
