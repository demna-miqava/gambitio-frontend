import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Friend } from "@/types";
import { Button } from "@/components/ui/button";
import { Swords, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/UserAvatar";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { useFriendActions } from "../hooks/useFriendActions";
import { getProfileRoute } from "@/constants/routes";
import { formatShortDate } from "@/lib/utils";

/** A friend's name, since when, and Profile / Challenge, from their avatar. */
const FriendPopover = ({
  children,
  data,
  canChallenge = true,
}: {
  children: React.ReactNode;
  data: Friend;
  /** Off on other players' profiles: their friends may not be yours */
  canChallenge?: boolean;
}) => {
  const { username, friendsSince, avatarUrl, id } = data;
  const { onChallenge } = useFriendActions();
  const avatarSrc = useAvatarSrc();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 space-y-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar src={avatarSrc(id, avatarUrl)} username={username} className="size-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{username}</p>
            {friendsSince && (
              <p className="text-xs text-muted-foreground">
                Friends since {formatShortDate(friendsSince)}
              </p>
            )}
          </div>
        </div>
        <div className={canChallenge ? "grid grid-cols-2 gap-2" : "grid"}>
          <Button asChild variant="outline" size="sm">
            <Link to={getProfileRoute(id)}>
              <UserRound aria-hidden="true" /> Profile
            </Link>
          </Button>
          {canChallenge && (
            <Button size="sm" onClick={() => onChallenge(data)}>
              <Swords aria-hidden="true" /> Challenge
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FriendPopover;
