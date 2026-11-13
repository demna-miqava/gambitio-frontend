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
import type { Friend } from "@/types";
import {
  Eye,
  MoreVertical,
  Swords,
  UserMinus,
  UserRoundPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getGameRoute, getProfileRoute } from "@/constants/routes";

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
  /** The game this person is playing right now, if any: shows "Watch" */
  liveGameId?: number | null;
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
  liveGameId,
}: FriendCardProps<T>) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const avatarSrc = useAvatarSrc();
  const watchGameId =
    liveGameId != null && friend.id !== currentUserId ? liveGameId : null;

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
      <UserAvatar
        src={avatarSrc(friend.id, friend.avatarUrl)}
        username={friend.username}
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{friend.username}</span>
        {watchGameId !== null && mode === "manage" && (
          <span className="flex items-center gap-1 text-xs font-medium text-rating-up">
            <span className="size-1.5 rounded-full bg-rating-up" aria-hidden="true" />
            Playing now
          </span>
        )}
        {secondaryText && (
          <span className="truncate text-xs text-muted-foreground">
            {secondaryText}
          </span>
        )}
      </div>
    </>
  );

  if (mode === "pick") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3">
        <div className="flex min-w-0 items-center gap-3">{identity}</div>
        {onChallenge && (
          <Button size="lg"
            variant="outline"
            onClick={() => onChallenge(friend)}
            className="shrink-0 px-4"
            aria-label={`Challenge ${friend.username}`}
          >
            <Swords className="size-4" aria-hidden="true" />
            Challenge
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3 sm:p-4">
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
