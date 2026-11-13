import { useCallback } from "react";
import { useUser } from "./useUser";

/**
 * Picks the avatar image for a player, so the signed-in user looks the same
 * everywhere: for themselves it is the avatar the sidebar shows (their
 * profile photo, else their Clerk image); for anyone else it is the stored
 * avatar URL. UserAvatar shows initials when there is no image.
 *
 * Returns a function so lists can resolve every row from one hook call:
 *   const avatarSrc = useAvatarSrc();
 *   <PlayerAvatar avatarUrl={avatarSrc(entry.id, entry.avatarUrl)} ... />
 */
export const useAvatarSrc = () => {
  const { id: currentUserId, image } = useUser();
  return useCallback(
    (userId: number | undefined, avatarUrl: string | null | undefined) =>
      currentUserId !== undefined && userId === currentUserId ? image : avatarUrl,
    [currentUserId, image]
  );
};
