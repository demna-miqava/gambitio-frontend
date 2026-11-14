import { useUserFriends } from "../hooks/useUserFriends";
import { UserAvatar } from "@/components/UserAvatar";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import FriendPopover from "../../components/Popover";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { useUser } from "@/hooks/useUser";
import { getProfileFriendsRoute } from "@/constants/routes";
import { SectionHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";

const GRID_LIMIT = 20;
/** Placeholder avatars when the friend count isn't known yet (one row) */
const DEFAULT_SKELETON_COUNT = 5;

const FriendsGrid = () => {
  const { friends, pagination, isLoading } = useUserFriends({ defaultLimit: GRID_LIMIT });
  const userId = useProfileUserId();
  const { id: currentUserId } = useUser();
  const avatarSrc = useAvatarSrc();
  // The profile header already loaded the friend count: use it for the
  // heading and the number of placeholders, so the card keeps its size
  const { profile } = useUserProfile();
  const total = pagination?.total ?? profile?.friendCount ?? 0;
  const skeletonCount = profile
    ? Math.min(profile.friendCount, GRID_LIMIT)
    : DEFAULT_SKELETON_COUNT;

  return (
    <aside className="flex flex-col gap-4 rounded-2xl bg-card p-5">
      <SectionHeader
        title={
          <>
            Friends <span className="font-normal text-muted-foreground">{total}</span>
          </>
        }
        action={
          total > 0 && (
            <Link
              to={getProfileFriendsRoute(userId || 0)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )
        }
      />
      {isLoading && skeletonCount > 0 ? (
        <div className="grid grid-cols-5 gap-2" role="status" aria-label="Loading friends">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i} className="flex justify-center">
              <Skeleton className="size-10 rounded-full" />
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">No friends yet.</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {friends.map((friend) => (
            <div key={friend.id} className="flex justify-center">
              {/* The popover shows the name, so no tooltip on top of it */}
              <FriendPopover
                data={friend}
                canChallenge={userId === currentUserId && friend.id !== currentUserId}
              >
                <button
                  type="button"
                  aria-label={friend.username}
                  title={friend.username}
                  className="rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <UserAvatar
                    src={avatarSrc(friend.id, friend.avatarUrl)}
                    username={friend.username}
                    className="size-10"
                  />
                </button>
              </FriendPopover>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default FriendsGrid;
