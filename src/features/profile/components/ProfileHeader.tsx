import { useUserProfile } from "../hooks/useUserProfile";
import InfoSection from "./InfoSection";
import { ProfileActions } from "./ProfileActions";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { useFriendStatuses } from "@/features/friends/status/useFriendStatuses";
import { AvatarWithPresence } from "@/features/friends/status/Presence";
import { isFriendship, useFriendship } from "../hooks/useFriendship";

/** Avatar, name and join date, with the actions for this player beside them. */
const ProfileHeader = () => {
  const { profile, isPending } = useUserProfile();
  const profileUserId = useProfileUserId();
  const avatarSrc = useAvatarSrc();
  // Known only for the signed-in user's friends: polled only on a friend's
  // profile (the same lookup ProfileActions makes, so no extra request)
  const isFriend = isFriendship(useFriendship(profile));
  const statuses = useFriendStatuses({ enabled: isFriend });
  const presence = isFriend ? statuses.byId.get(profileUserId) : undefined;
  const liveGameId = presence?.gameId ?? undefined;

  // Same boxes as the loaded header (avatar, name and meta lines, the action
  // row that wraps below on phones), so nothing moves when it loads
  if (isPending || !profile) {
    return (
      <header
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        role="status"
        aria-label="Loading profile"
      >
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Skeleton className="size-20 shrink-0 rounded-2xl sm:size-28" />
          <div className="space-y-1.5">
            <div className="flex h-9 items-center sm:h-10">
              <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full shrink-0 rounded-md sm:w-32" />
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        <AvatarWithPresence
          presence={presence}
          dotClassName="-right-1 -bottom-1 size-4 ring-[3px] ring-background sm:size-5"
        >
          <UserAvatar
            // Your own profile shows the same image as the sidebar
            src={avatarSrc(profile.id, profile.avatarUrl)}
            username={profile.username}
            className="size-20 rounded-2xl ring-1 ring-border sm:size-28"
            fallbackClassName="text-2xl"
          />
        </AvatarWithPresence>
        <InfoSection
          username={profile.username}
          joinedAt={profile.createdAt || ""}
          friendsCount={profile.friendCount || 0}
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        <ProfileActions profile={profile} liveGameId={liveGameId} />
      </div>
    </header>
  );
};

export default ProfileHeader;
