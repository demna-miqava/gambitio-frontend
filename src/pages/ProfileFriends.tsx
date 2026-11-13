import { PendingFriendRequests } from "@/features/friends/requests/components/PendingFriendRequests";
import { FriendsPaginatedList } from "@/features/friends/list/components/FriendsPaginatedList";
import { FriendsSearch } from "@/features/friends/list/components/FriendsSearch";
import { SuggestedFriends } from "@/features/friends/suggestions/components/SuggestedFriends";
import { useUserFriends } from "@/features/friends/list/hooks/useUserFriends";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { useUser } from "@/hooks/useUser";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { SectionHeader } from "@/components/PageHeader";
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

          <FriendsPaginatedList
            friends={friends}
            page={page}
            setPage={setPage}
            pagination={pagination}
            isLoading={isLoading}
            skeletonRows={expectedRows}
            // Only your own friends can be challenged (or removed)
            onChallenge={isOwnProfile ? onChallenge : undefined}
            onRemove={isOwnProfile ? onRemove : undefined}
            currentUserId={currentUserId}
            isOwnProfile={isOwnProfile}
            searchSlot={<FriendsSearch />}
            emptyMessage={
              search ? `No friends match “${search}”` : "No friends yet"
            }
            showPagination={!search}
          />
        </div>

        {isOwnProfile && <SuggestedFriends />}
      </section>
      {isOwnProfile && <PendingFriendRequests />}
    </section>
  );
};

export default ProfileFriends;
