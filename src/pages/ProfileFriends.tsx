import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PendingFriendRequests } from "@/features/friends/requests/components/PendingFriendRequests";
import { FriendsPaginatedList } from "@/features/friends/list/components/FriendsPaginatedList";
import { FriendsSearch } from "@/features/friends/list/components/FriendsSearch";
import { SuggestedFriends } from "@/features/friends/suggestions/components/SuggestedFriends";
import { useUserFriends } from "@/features/friends/list/hooks/useUserFriends";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { useFriendStatuses } from "@/features/friends/status/useFriendStatuses";
import {
  FRIENDS_SHOW_PARAM,
  inStableOrder,
  sameIds,
  type FriendsShow,
} from "@/features/friends/status/onlineFilter";
import { useUser } from "@/hooks/useUser";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { SectionHeader } from "@/components/PageHeader";
import { SegmentedRadioGroup } from "@/components/SegmentedRadioGroup";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";

const ProfileFriends = () => {
  const { friends, page, setPage, pagination, search, isLoading, limit } =
    useUserFriends({});
  // The profile already knows the friend count: size the loading rows (and
  // the count in the heading) by it so the list doesn't jump when it loads
  const { profile } = useUserProfile();
  const { onChallenge, onRemove } = useFriendActions();
  const { id: currentUserId } = useUser();
  const userId = useProfileUserId();
  const isOwnProfile = currentUserId === userId;
  const total = pagination?.total ?? (search ? 0 : profile?.friendCount ?? 0);
  const expectedRows =
    profile && !search
      ? Math.max(0, Math.min(limit, profile.friendCount - (page - 1) * limit))
      : undefined;

  // All friends, or (your own profile only) just those online or playing:
  // ?show=online, which the friends icon's "See all" links to. The online
  // list is already loaded whole, so it is searched and paged here.
  const [searchParams, setSearchParams] = useSearchParams();
  const showOnline = isOwnProfile && searchParams.get(FRIENDS_SHOW_PARAM) === "online";
  const setShow = (show: FriendsShow) => {
    const next = new URLSearchParams(searchParams);
    if (show === "online") next.set(FRIENDS_SHOW_PARAM, "online");
    else next.delete(FRIENDS_SHOW_PARAM);
    next.delete("page");
    setSearchParams(next);
  };
  const {
    statuses,
    isPending: statusesPending,
    isError: statusesFailed,
    refetch: refetchStatuses,
  } = useFriendStatuses({ enabled: isOwnProfile });
  // Friends keep their places between polls (see inStableOrder)
  const [shownIds, setShownIds] = useState<number[]>([]);
  const ordered = useMemo(() => inStableOrder(shownIds, statuses), [shownIds, statuses]);
  const orderedIds = ordered.map((status) => status.id);
  if (!sameIds(orderedIds, shownIds)) setShownIds(orderedIds);
  const online = useMemo(() => {
    const query = search.toLowerCase();
    return query ? ordered.filter((s) => s.username.toLowerCase().includes(query)) : ordered;
  }, [ordered, search]);
  const onlinePages = Math.max(1, Math.ceil(online.length / limit));
  const onlinePage = Math.min(page, onlinePages);

  const actions = {
    // Only your own friends can be challenged (or removed)
    onChallenge: isOwnProfile ? onChallenge : undefined,
    onRemove: isOwnProfile ? onRemove : undefined,
    currentUserId,
    isOwnProfile,
    searchSlot: <FriendsSearch />,
  };

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
      <section className="space-y-8">
        <div className="space-y-4">
          <SectionHeader
            title={
              <>
                Friends <span className="font-normal text-muted-foreground">{total}</span>
              </>
            }
          />

          {isOwnProfile && (
            <SegmentedRadioGroup<FriendsShow>
              label="Show friends"
              value={showOnline ? "online" : "all"}
              onValueChange={setShow}
              options={[
                { value: "all", label: `All ${total}` },
                {
                  value: "online",
                  // No count until it's known (loading, or the request failed)
                  label: statusesPending || statusesFailed ? "Online" : `Online ${statuses.length}`,
                },
              ]}
              className="w-full sm:w-72"
            />
          )}

          {showOnline && statusesFailed ? (
            <div className="space-y-4">
              <FriendsSearch />
              <EmptyState
                icon={WifiOff}
                title="Couldn't load which friends are online"
                description="Check your connection and try again."
                action={
                  <Button size="lg" variant="outline" onClick={() => void refetchStatuses()}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : showOnline ? (
            <FriendsPaginatedList
              {...actions}
              friends={online.slice((onlinePage - 1) * limit, onlinePage * limit)}
              page={onlinePage}
              setPage={setPage}
              pagination={{ total: online.length, totalPages: onlinePages }}
              isLoading={statusesPending}
              emptyMessage={
                search
                  ? `No friends online match “${search}”`
                  : "None of your friends are online right now"
              }
            />
          ) : (
            <FriendsPaginatedList
              {...actions}
              friends={friends}
              page={page}
              setPage={setPage}
              pagination={pagination}
              isLoading={isLoading}
              skeletonRows={expectedRows}
              emptyMessage={
                search ? `No friends match “${search}”` : "No friends yet"
              }
              showPagination={!search}
            />
          )}
        </div>

        {isOwnProfile && <SuggestedFriends />}
      </section>
      {isOwnProfile && <PendingFriendRequests />}
    </section>
  );
};

export default ProfileFriends;
