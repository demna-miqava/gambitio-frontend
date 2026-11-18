import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/hooks/useUser";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import FriendPopover from "../components/Popover";
import { useFriendStatuses } from "./useFriendStatuses";
import { AvatarWithPresence } from "./Presence";
import { presenceLabel } from "./presenceLabel";
import { getOnlineFriendsRoute } from "./onlineFilter";

/** Avatars in the row; with more online the last place says "+N" (one row in the 23rem popover) */
const SHOWN = 6;

const avatarButton =
  "relative rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover";

/**
 * The FriendsInbox section listing friends who are online or playing: one
 * row of avatars (free to play first, then playing), however many there
 * are; the rest are on the friends page's Online filter. An avatar opens
 * the friend's card: Profile, and Challenge or Watch.
 *
 * Fetched only while the popover is open (`enabled`), so the icon on every
 * page doesn't poll for a list nobody is looking at.
 */
export const OnlineNow = ({
  enabled,
  onNavigate,
}: {
  enabled: boolean;
  /** "See all" can link to the page already open: the popover closes itself */
  onNavigate?: () => void;
}) => {
  const { id } = useUser();
  const avatarSrc = useAvatarSrc();
  const { statuses, isPending, isError } = useFriendStatuses({ enabled });
  const shown = statuses.slice(0, statuses.length > SHOWN + 1 ? SHOWN : SHOWN + 1);
  const more = statuses.length - shown.length;
  const seeAll = id ? getOnlineFriendsRoute(id) : null;

  return (
    <section className="space-y-3 p-4" aria-labelledby="inbox-online">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span id="inbox-online">Online now</span>
          {statuses.length > 0 && <span className="tabular-nums">{statuses.length}</span>}
        </h3>
        {seeAll && statuses.length > 0 && (
          <Link
            to={seeAll}
            onClick={onNavigate}
            className="relative touch-target text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            See all
          </Link>
        )}
      </div>

      {isPending ? (
        <div className="flex gap-2" role="status" aria-label="Loading friends online">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="size-10 rounded-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Couldn't load your friends.</p>
      ) : statuses.length === 0 ? (
        <p className="text-sm text-muted-foreground">None of your friends are online right now.</p>
      ) : (
        <ul className="flex gap-2">
          {shown.map((friend) => {
            const label = `${friend.username}, ${presenceLabel(friend).toLowerCase()}`;
            return (
              <li key={friend.id}>
                <FriendPopover data={friend} presence={friend} canChallenge={friend.status === "online"}>
                  <button type="button" aria-label={label} title={label} className={avatarButton}>
                    <AvatarWithPresence presence={friend} dotClassName="size-2.5 ring-popover" announce={false}>
                      <UserAvatar
                        src={avatarSrc(friend.id, friend.avatarUrl)}
                        username={friend.username}
                        className="size-10"
                      />
                    </AvatarWithPresence>
                  </button>
                </FriendPopover>
              </li>
            );
          })}
          {more > 0 && seeAll && (
            <li>
              <Link
                to={seeAll}
                onClick={onNavigate}
                aria-label={`See all ${statuses.length} friends online`}
                className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                +{more}
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  );
};
