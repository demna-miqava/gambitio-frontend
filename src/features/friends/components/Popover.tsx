import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Friend } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Swords, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { AvatarWithPresence } from "../status/Presence";
import { presenceLabel, type Presence } from "../status/presenceLabel";
import { UserAvatar } from "@/components/UserAvatar";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { useFriendActions } from "../hooks/useFriendActions";
import { getGameRoute, getProfileRoute } from "@/constants/routes";
import { formatShortDate } from "@/lib/utils";

/**
 * A friend's name, since when (or whether they're online or playing), and
 * Profile / Challenge, from their avatar. Watch instead of Challenge while
 * they're playing.
 */
const FriendPopover = ({
  children,
  data,
  canChallenge = true,
  presence,
}: {
  children: React.ReactNode;
  data: Friend;
  /** Off on other players' profiles: their friends may not be yours */
  canChallenge?: boolean;
  /** Known for your own friends: online, playing (with the game), or null */
  presence?: (Presence & { gameId: number | null }) | null;
}) => {
  const { username, friendsSince, avatarUrl, id } = data;
  const { onChallenge } = useFriendActions();
  const avatarSrc = useAvatarSrc();
  const watchGameId = presence?.gameId ?? null;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 space-y-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithPresence presence={presence} dotClassName="size-2.5 ring-popover" announce={false}>
            <UserAvatar src={avatarSrc(id, avatarUrl)} username={username} className="size-10" />
          </AvatarWithPresence>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{username}</p>
            {presence ? (
              <p className="text-xs text-muted-foreground">{presenceLabel(presence)}</p>
            ) : (
              friendsSince && (
                <p className="text-xs text-muted-foreground">
                  Friends since {formatShortDate(friendsSince)}
                </p>
              )
            )}
          </div>
        </div>
        <div className={canChallenge || watchGameId !== null ? "grid grid-cols-2 gap-2" : "grid"}>
          <Button asChild variant="outline" size="sm">
            <Link to={getProfileRoute(id)}>
              <UserRound aria-hidden="true" /> Profile
            </Link>
          </Button>
          {watchGameId !== null ? (
            <Button asChild size="sm">
              <Link to={getGameRoute(watchGameId)}>
                <Eye aria-hidden="true" /> Watch
              </Link>
            </Button>
          ) : (
            canChallenge && (
              <Button size="sm" onClick={() => onChallenge(data)}>
                <Swords aria-hidden="true" /> Challenge
              </Button>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FriendPopover;
