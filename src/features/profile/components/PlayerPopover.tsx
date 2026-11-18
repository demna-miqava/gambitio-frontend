import { ProvisionalMark } from "@/components/ProvisionalMark";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Ban, Check, Clock, UserRound, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { getProfileRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { formatShortDate } from "@/lib/utils";
import { getUserProfile } from "@/services/user";
import { ResultsBar } from "@/features/stats/components/ResultsBar";
import { useHeadToHead } from "@/features/series/hooks/useSeries";
import { useSendFriendRequest } from "@/features/friends/suggestions/hooks/useSendFriendRequest";
import { useFriendRequestAction } from "@/features/friends/requests/hooks/useFriendRequestAction";
import { useFriendship } from "../hooks/useFriendship";
import { useIsBlocked, useUnblockUser } from "@/features/moderation/hooks/useBlocks";
import {
  ModerationDialogs,
  ModerationMenu,
  type ModerationAction,
} from "@/features/moderation/components/PlayerModeration";

export interface PopoverPlayer {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

const RATINGS = [
  { key: "bulletRating", provisional: "bulletProvisional", label: "Bullet" },
  { key: "blitzRating", provisional: "blitzProvisional", label: "Blitz" },
  { key: "rapidRating", provisional: "rapidProvisional", label: "Rapid" },
] as const;

/** Your record against the player: games, then series if you've played any. */
const HeadToHead = ({ player }: { player: PopoverPlayer }) => {
  const { data, isPending, isError, refetch } = useHeadToHead(player.id);
  const games = data ? data.wins + data.draws + data.losses : 0;
  const { won = 0, lost = 0, drawn = 0 } = data?.series ?? {};

  return (
    <section className="space-y-2.5" aria-labelledby="player-popover-record">
      <h3 id="player-popover-record" className="text-xs font-medium text-muted-foreground">
        Head to head
        {games > 0 && (
          <span className="font-normal tabular-nums">
            {" "}
            · {games} {games === 1 ? "game" : "games"}
          </span>
        )}
      </h3>
      {isPending ? (
        <Skeleton className="h-14 w-full" role="status" aria-label="Loading head to head" />
      ) : isError || !data ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          Couldn't load your record.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : games === 0 ? (
        <p className="text-sm text-muted-foreground">
          No finished games against {player.username} yet.
        </p>
      ) : (
        <>
          <ResultsBar wins={data.wins} draws={data.draws} losses={data.losses} />
          {won + lost + drawn > 0 && (
            <p className="text-xs text-muted-foreground">
              Series:{" "}
              <span className="tabular-nums text-foreground">
                {won} won · {drawn} drawn · {lost} lost
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
};

/**
 * Add friend, or where the request stands; Unblock for a player you've
 * blocked. Nothing that leaves the page.
 */
const Friendship = ({ player }: { player: PopoverPlayer }) => {
  const status = useFriendship(player);
  const sendRequest = useSendFriendRequest();
  const requestAction = useFriendRequestAction();
  const isBlocked = useIsBlocked(player.id);
  const unblock = useUnblockUser();

  if (isBlocked) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={unblock.isPending}
        onClick={() => unblock.mutate(player)}
      >
        <Ban aria-hidden="true" /> Unblock
      </Button>
    );
  }

  switch (status.kind) {
    case "loading":
      return <Skeleton className="h-8 w-full" />;
    case "friends":
      return (
        <span className="flex h-8 items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Check className="size-4" aria-hidden="true" /> Friends
        </span>
      );
    case "request-sent":
      return (
        <span className="flex h-8 items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" /> Request sent
        </span>
      );
    case "request-received":
      return (
        <Button
          size="sm"
          disabled={requestAction.isPending}
          onClick={() =>
            requestAction.mutate({ requestId: String(status.request.id), action: "accept" })
          }
        >
          <Check aria-hidden="true" /> Accept request
        </Button>
      );
    case "none":
      return (
        <Button
          size="sm"
          disabled={sendRequest.isPending}
          onClick={() => sendRequest.mutate(player.id)}
        >
          <UserRoundPlus aria-hidden="true" /> Add friend
        </Button>
      );
    default:
      return null;
  }
};

/** The card itself (exported for tests; PlayerPopover is how pages use it). */
export const PlayerCard = ({
  player,
  showRatings,
  profileInNewTab,
  onModerate,
}: {
  player: PopoverPlayer;
  showRatings: boolean;
  profileInNewTab: boolean;
  /** Block or report was picked: shows the "more" menu on other players' cards */
  onModerate?: (action: ModerationAction) => void;
}) => {
  const { id: viewerId } = useUser();
  const avatarSrc = useAvatarSrc();
  const isSelf = viewerId === player.id;
  const { data, isPending } = useQuery({
    queryKey: [QKEY_USER_PROFILE, player.id],
    queryFn: () => getUserProfile(player.id),
  });
  const profile = data?.user;

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          src={avatarSrc(player.id, player.avatarUrl)}
          username={player.username}
          className="size-12 shrink-0"
        />
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">{player.username}</p>
          {isPending ? (
            <Skeleton className="h-4 w-28" />
          ) : (
            profile?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Joined {formatShortDate(profile.createdAt)}
              </p>
            )
          )}
        </div>
        {!isSelf && onModerate && (
          <div className="-mr-1.5 ml-auto self-start">
            <ModerationMenu player={player} onAction={onModerate} />
          </div>
        )}
      </div>

      {showRatings && (
        <dl className="grid grid-cols-3 gap-3">
          {RATINGS.map(({ key, provisional, label }) => (
            <div key={key}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-display-num text-lg text-foreground">
                {isPending ? (
                  <Skeleton className="mt-1 h-5 w-10" />
                ) : (
                  <>
                    {profile?.[key] ?? "–"}
                    {profile && <ProvisionalMark provisional={profile[provisional]} />}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {!isSelf && <HeadToHead player={player} />}

      <div className={isSelf ? "grid" : "grid grid-cols-2 gap-2"}>
        {!isSelf && <Friendship player={player} />}
        <Button asChild variant="outline" size="sm">
          <Link
            to={getProfileRoute(player.id)}
            {...(profileInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <UserRound aria-hidden="true" /> Profile
          </Link>
        </Button>
      </div>
    </div>
  );
};

interface PlayerPopoverProps {
  player: PopoverPlayer;
  /** Off while the viewer hides ratings during a game (Settings) */
  showRatings?: boolean;
  /** Open the profile in a new tab, so a game in progress isn't left */
  profileInNewTab?: boolean;
  /**
   * A game the viewer and this player played against each other (the one on
   * screen): it is sent along if the viewer reports the player
   */
  gameId?: number;
  /** The avatar that opens the card */
  children: ReactNode;
}

/**
 * A player's card, from their avatar beside the board: when they joined,
 * their ratings, your record against them, Add friend, and block or
 * report. Nothing is fetched until it's opened.
 */
export const PlayerPopover = ({
  player,
  showRatings = true,
  profileInNewTab = false,
  gameId,
  children,
}: PlayerPopoverProps) => {
  const [open, setOpen] = useState(false);
  // The block and report dialogs live outside the card: opening one closes
  // the popover, which would take a dialog inside it along
  const [action, setAction] = useState<ModerationAction | null>(null);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`About ${player.username}`}
            className="relative touch-target shrink-0 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {children}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-72 rounded-xl p-4">
          <PlayerCard
            player={player}
            showRatings={showRatings}
            profileInNewTab={profileInNewTab}
            onModerate={(picked) => {
              setOpen(false);
              setAction(picked);
            }}
          />
        </PopoverContent>
      </Popover>
      <ModerationDialogs
        player={player}
        action={action}
        onClose={() => setAction(null)}
        {...(gameId !== undefined && { gameId })}
      />
    </>
  );
};
