import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import type { Friend, FriendStatus } from "@/types";
import {
  Eye,
  MoreVertical,
  SlidersHorizontal,
  Swords,
  UserMinus,
  UserRoundPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getGameRoute, getProfileRoute } from "@/constants/routes";
import { AvatarWithPresence } from "../status/Presence";
import { presenceLabel } from "../status/presenceLabel";

export type FriendCardMode = "manage" | "pick";

interface FriendCardProps<T extends Friend> {
  friend: T;
  onChallenge?: (friend: Friend) => void;
  onRemove?: (id: number) => void;
  onAddFriend?: (id: number) => void;
  secondaryText?: React.ReactNode;
  currentUserId?: number;
  isOwnProfile?: boolean;
  /**
   * "manage" (default): name links to the profile, actions collapse into a
   * menu on small screens. "pick": used when choosing whom to challenge; the
   * row doesn't navigate and Challenge is always visible.
   */
  mode?: FriendCardMode;
  /**
   * Whether this friend is online or playing: a dot on the avatar, and
   * "Watch" when playing (not when picking whom to challenge). Null or left
   * out: offline, or not known (someone who isn't your friend).
   */
  presence?: FriendStatus | null;
  /**
   * "pick" only: Challenge sends at once what `label` names ("5+0", the
   * last challenge's time control), and a second button opens the form
   * (`onChallenge`) for anything else.
   */
  quickChallenge?: { label: string; onSend: (friend: Friend) => void };
  /** "pick" only: a challenge to this friend is waiting on their answer */
  isChallenged?: boolean;
}

export function FriendCard<T extends Friend>({
  friend,
  onChallenge,
  onRemove,
  onAddFriend,
  secondaryText,
  currentUserId,
  isOwnProfile = true,
  mode = "manage",
  presence,
  quickChallenge,
  isChallenged = false,
}: FriendCardProps<T>) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const avatarSrc = useAvatarSrc();
  const watchGameId =
    mode === "manage" && presence?.gameId != null && friend.id !== currentUserId
      ? presence.gameId
      : null;

  const actions = [
    onChallenge && {
      icon: Swords,
      label: "Challenge",
      onClick: () => onChallenge(friend),
    },
    onAddFriend && {
      icon: UserRoundPlus,
      label: "Add friend",
      onClick: () => onAddFriend(friend.id),
      variant: "default" as const,
    },
    onRemove && {
      icon: UserMinus,
      label: "Remove",
      // Asks first (ConfirmDialog below)
      onClick: () => setConfirmRemove(true),
      destructive: true,
    },
  ]
    .filter(Boolean)
    .filter((action) => {
      if (!action) return false;

      // If the friend is the current user, hide all actions
      if (currentUserId && friend.id === currentUserId) {
        return false;
      }

      // Only your own friends can be removed
      if (!isOwnProfile) {
        return action.label !== "Remove";
      }

      return true;
    }) as Array<{
    icon: typeof Swords;
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
    destructive?: boolean;
  }>;

  const identity = (
    <>
      {/* The status is said in words under the name, so the dot stays silent */}
      <AvatarWithPresence presence={presence} announce={false}>
        <UserAvatar
          src={avatarSrc(friend.id, friend.avatarUrl)}
          username={friend.username}
        />
      </AvatarWithPresence>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{friend.username}</span>
        {(presence || secondaryText) && (
          <span className="truncate text-xs text-muted-foreground">
            {presence && (
              <span className="font-medium text-foreground">{presenceLabel(presence)}</span>
            )}
            {presence && secondaryText ? (
              // In the picker the buttons leave little room: the status
              // alone where both wouldn't fit
              <span className={mode === "pick" ? "hidden @sm:inline" : undefined}>
                {" · "}
                {secondaryText}
              </span>
            ) : (
              secondaryText
            )}
          </span>
        )}
      </div>
    </>
  );

  if (mode === "pick") {
    return (
      <div className="@container flex items-center justify-between gap-3 rounded-xl bg-card p-3">
        <div className="flex min-w-0 items-center gap-3">{identity}</div>
        {isChallenged ? (
          <span className="shrink-0 px-1 text-sm text-muted-foreground">Challenge sent</span>
        ) : quickChallenge ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="lg"
              onClick={() => quickChallenge.onSend(friend)}
              className="px-4"
              aria-label={`Challenge ${friend.username} to ${quickChallenge.label}`}
            >
              <Swords className="size-4" aria-hidden="true" />
              {/* The word only where the row has room; the time always shows */}
              <span className="hidden @sm:inline">Challenge</span>
              <span className="tabular-nums">{quickChallenge.label}</span>
            </Button>
            {onChallenge && (
              <Button
                size="icon-lg"
                variant="outline"
                onClick={() => onChallenge(friend)}
                aria-label={`Other options for a challenge to ${friend.username}`}
                title="Other options"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ) : (
          onChallenge && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => onChallenge(friend)}
              className="shrink-0 px-4"
              aria-label={`Challenge ${friend.username}`}
            >
              <Swords className="size-4" aria-hidden="true" />
              Challenge
            </Button>
          )
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 sm:p-4">
      <Link
        to={getProfileRoute(friend.id)}
        className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
      >
        {identity}
      </Link>

      {(actions.length > 0 || watchGameId !== null) && (
        <div className="flex shrink-0 items-center gap-2">
          {watchGameId !== null && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="max-md:size-11 max-md:px-0"
            >
              <Link
                to={getGameRoute(watchGameId)}
                aria-label={`Watch ${friend.username}'s game`}
              >
                <Eye className="size-4" aria-hidden="true" />
                <span className="max-md:sr-only">Watch</span>
              </Link>
            </Button>
          )}
          {/* Desktop actions */}
          <div className="hidden gap-2 md:flex">
            {actions.map(
              ({ icon: Icon, label, onClick, variant = "outline", destructive }) => (
                <Button
                  key={label}
                  size="sm"
                  variant={variant}
                  onClick={onClick}
                  className={
                    destructive
                      ? "text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      : undefined
                  }
                  aria-label={`${label} ${friend.username}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Button>
              )
            )}
          </div>

          {/* Mobile dropdown */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Actions for ${friend.username}`}
                >
                  <MoreVertical className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map(({ icon: Icon, label, onClick, destructive }) => (
                  <DropdownMenuItem
                    key={label}
                    onSelect={onClick}
                    variant={destructive ? "destructive" : "default"}
                    className="min-h-11"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {onRemove && (
        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setConfirmRemove}
          title={`Remove ${friend.username} from your friends?`}
          description="You won't be able to challenge each other until one of you sends a new friend request."
          confirmLabel="Remove"
          destructive
          onConfirm={() => {
            onRemove(friend.id);
            setConfirmRemove(false);
          }}
        />
      )}
    </div>
  );
}
