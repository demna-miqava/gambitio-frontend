import { ProvisionalMark } from "@/components/ProvisionalMark";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Ban, Check, Clock, Swords, UserRound, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuelInviteButton } from "@/features/puzzles/duel/components/DuelInviteButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { usePlayerCardDock } from "@/context/GameShellContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getChallengeFriendRoute } from "@/features/create-game/utils/setupRoute";
import { getResult } from "@/features/game-table/utils/gameResult";
import { playedLabel } from "@/utils/playedLabel";
import { UserAvatar } from "@/components/UserAvatar";
import { QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { getGameReviewRoute, getProfileRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { cn, formatShortDate } from "@/lib/utils";
import type { TimeControlType } from "@/types";
import { getUserProfile } from "@/services/user";
import { ResultsBar } from "@/features/stats/components/ResultsBar";
import { useHeadToHead } from "@/features/series/hooks/useSeries";
import { useSendFriendRequest } from "@/features/friends/suggestions/hooks/useSendFriendRequest";
import { useFriendRequestAction } from "@/features/friends/requests/hooks/useFriendRequestAction";
import { useFriendship } from "../hooks/useFriendship";
import { useBlockUser, useIsBlocked, useUnblockUser } from "@/features/moderation/hooks/useBlocks";
import { ModerationDialogs } from "@/features/moderation/components/PlayerModeration";

export interface PopoverPlayer {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

const RATINGS = [
  { speed: "bullet", key: "bulletRating", provisional: "bulletProvisional", label: "Bullet" },
  { speed: "blitz", key: "blitzRating", provisional: "blitzProvisional", label: "Blitz" },
  { speed: "rapid", key: "rapidRating", provisional: "rapidProvisional", label: "Rapid" },
] as const;

const LAST_RESULT = { win: "you won", loss: "you lost", draw: "a draw", aborted: "aborted" } as const;

/** "2 hours ago", "yesterday", "on 12 Nov": playedLabel inside a sentence */
const whenInSentence = (playedAt: string | Date) => {
  const label = playedLabel(playedAt);
  return /^\d/.test(label) && !label.endsWith("ago") ? `on ${label}` : label.toLowerCase();
};

/**
 * Your record against the player: the games, how the last one went (with a
 * way into its review), then series if you've played any.
 */
const HeadToHead = ({ player, linksInNewTab }: { player: PopoverPlayer; linksInNewTab: boolean }) => {
  const { id: viewerId } = useUser();
  const { data, isPending, isError, refetch } = useHeadToHead(player.id);
  const games = data ? data.wins + data.draws + data.losses : 0;
  const { won = 0, lost = 0, drawn = 0 } = data?.series ?? {};
  const last = data?.recentGames.find((game) => game.status === "finished");

  return (
    <section className="space-y-2.5" aria-labelledby="player-popover-record">
      <h3 id="player-popover-record" className="text-xs font-medium text-muted-foreground">
        You against {player.username}
        {games > 0 && (
          <span className="font-normal tabular-nums">
            {" "}
            · {games} {games === 1 ? "game" : "games"}
          </span>
        )}
      </h3>
      {isPending ? (
        <Skeleton className="h-14 w-full" role="status" aria-label="Loading your record" />
      ) : isError || !data ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          Couldn't load your record.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : games === 0 ? (
        <p className="text-sm text-muted-foreground">You haven't played each other yet.</p>
      ) : (
        <>
          <ResultsBar wins={data.wins} draws={data.draws} losses={data.losses} />
          {last && (
            <p className="text-[13px] text-muted-foreground">
              Last game: {LAST_RESULT[getResult(last, viewerId)]}, {whenInSentence(last.createdAt)}.{" "}
              <Link
                to={getGameReviewRoute(last.id)}
                {...(linksInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
                className="font-semibold text-primary underline-offset-[3px] hover:underline"
              >
                Review
              </Link>
            </p>
          )}
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
const Friendship = ({
  player,
  canDuel,
  canChallenge,
}: {
  player: PopoverPlayer;
  canDuel: boolean;
  canChallenge: boolean;
}) => {
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
      // Friends can race each other at puzzles from here, but not from a
      // game being played: a duel leaves the page, and its invite would
      // land on the opponent's board
      return canChallenge ? (
        // Home: the challenge form for this friend (time, colour, rated or not)
        <Button asChild size="sm">
          <Link to={getChallengeFriendRoute(player.id)}>
            <Swords aria-hidden="true" /> Challenge
          </Link>
        </Button>
      ) : canDuel ? (
        <DuelInviteButton friend={player} />
      ) : (
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

/**
 * Block and Report, as quiet links under the card. Block asks first, in
 * place: the card is the confirmation, nothing opens over it. Report has a
 * form, so the caller opens its dialog.
 */
const Moderation = ({
  player,
  onReport,
  confirming,
  setConfirming,
}: {
  player: PopoverPlayer;
  onReport: () => void;
  /** The block question is showing. Held by whatever shows the card, so its Escape can answer it */
  confirming: boolean;
  setConfirming: (confirming: boolean) => void;
}) => {
  const isBlocked = useIsBlocked(player.id);
  const block = useBlockUser();
  const quiet =
    "relative touch-target rounded-[3px] text-[13px] text-muted-foreground underline-offset-[3px] outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring";

  if (confirming && !isBlocked) {
    return (
      <div role="alertdialog" aria-label={`Block ${player.username}?`} className="grid gap-3 rounded-[10px] bg-muted p-3 text-sm">
        <p>
          <b className="font-semibold">Block {player.username}?</b> They can't challenge or message you,
          you won't be paired, and a friendship between you ends. They aren't told.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={block.isPending}
            onClick={() => block.mutate(player, { onSettled: () => setConfirming(false) })}
          >
            Block
          </Button>
          <Button size="sm" variant="outline" className="bg-card" autoFocus onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-5">
      {/* A blocked player is unblocked from the button above */}
      {!isBlocked && (
        <button type="button" className={quiet} onClick={() => setConfirming(true)}>
          Block
        </button>
      )}
      <button type="button" className={quiet} onClick={onReport}>
        Report
      </button>
    </div>
  );
};

/** The card itself (exported for tests; PlayerPopover is how pages use it). */
export const PlayerCard = ({
  player,
  showRatings,
  profileInNewTab,
  speed,
  canChallenge = false,
  onReport,
  blockConfirm,
}: {
  player: PopoverPlayer;
  showRatings: boolean;
  profileInNewTab: boolean;
  /** The pool being played: its rating tile is the one picked out */
  speed?: TimeControlType;
  /** Offer a friend a challenge (Home, where nothing is being played) */
  canChallenge?: boolean;
  /** Opens the report form: other players' cards then offer Block and Report */
  onReport?: () => void;
  /**
   * Whether the block question is showing, when the card's owner holds that
   * (so Escape takes the question back before it closes the card);
   * otherwise the card holds it itself
   */
  blockConfirm?: { open: boolean; setOpen: (open: boolean) => void };
}) => {
  const [ownConfirm, setOwnConfirm] = useState(false);
  const confirming = blockConfirm?.open ?? ownConfirm;
  const setConfirming = blockConfirm?.setOpen ?? setOwnConfirm;
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
          <p className="truncate font-display text-[17px] leading-tight text-foreground">{player.username}</p>
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
      </div>

      {showRatings && (
        <dl className="grid grid-cols-3 gap-2">
          {RATINGS.map(({ speed: pool, key, provisional, label }) => (
            <div
              key={key}
              className={cn("rounded-[10px] px-2.5 py-2", pool === speed ? "bg-primary-soft" : "bg-muted")}
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-display-num text-[17px] font-semibold text-foreground">
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

      {!isSelf && <HeadToHead player={player} linksInNewTab={profileInNewTab} />}

      <div className={isSelf ? "grid" : "grid grid-cols-2 gap-2"}>
        {!isSelf && (
          <Friendship player={player} canDuel={!profileInNewTab} canChallenge={canChallenge && !profileInNewTab} />
        )}
        <Button asChild variant="outline" size="sm">
          <Link
            to={getProfileRoute(player.id)}
            {...(profileInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <UserRound aria-hidden="true" /> {isSelf ? "View profile" : "Profile"}
          </Link>
        </Button>
      </div>

      {!isSelf && onReport && (
        <Moderation player={player} onReport={onReport} confirming={confirming} setConfirming={setConfirming} />
      )}
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
  /** The pool being played (a game page): its rating is picked out */
  speed?: TimeControlType;
  /** Offer a friend a challenge from the card (Home) */
  canChallenge?: boolean;
  /**
   * What opens the card: the avatar (a round button), or the player's name
   * as text that underlines on hover
   */
  trigger?: "avatar" | "name";
  /** The avatar or the name that opens the card */
  children: ReactNode;
}

/** Closes the card that is in the dock now: there is room for one */
let closeDockedCard: (() => void) | null = null;

/**
 * The card over the top of a live game's side rail (GameShell's cardDock):
 * beside the board, never on it. Not modal: the game goes on underneath.
 * Escape, the close button or a press anywhere else closes it, and focus
 * goes back to the name it was opened from. One at a time: opening the
 * other player's card (from the keyboard, where no press closes this one)
 * takes its place. `onEscape` returning true has used the key (the block
 * question was taken back) and the card stays.
 */
const DockedCard = ({
  dock,
  label,
  trigger,
  onClose,
  onEscape,
  children,
}: {
  dock: HTMLElement;
  label: string;
  trigger: HTMLElement | null;
  onClose: () => void;
  onEscape: () => boolean;
  children: ReactNode;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus comes to the card when it opens, and goes back to the name it was
  // opened from when it closes, unless it has gone somewhere else by then
  useEffect(() => {
    cardRef.current?.focus();
    return () => {
      if (!document.activeElement || document.activeElement === document.body) trigger?.focus();
    };
  }, [trigger]);

  useEffect(() => {
    closeDockedCard?.();
    closeDockedCard = onClose;
    return () => {
      if (closeDockedCard === onClose) closeDockedCard = null;
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      if (!onEscape()) onClose();
    };
    const onPress = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || cardRef.current?.contains(target) || trigger?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    // Capture: the board stops some presses from bubbling (drawing arrows
    // with the right button), and those are presses elsewhere too
    document.addEventListener("pointerdown", onPress, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress, true);
    };
  }, [onClose, onEscape, trigger]);

  return createPortal(
    <div
      ref={cardRef}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className="relative max-h-full overflow-y-auto rounded-b-[10px] border-b border-border bg-card p-4 shadow-lg outline-none animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-8 text-muted-foreground"
        aria-label="Close"
        onClick={() => {
          onClose();
          trigger?.focus();
        }}
      >
        <X aria-hidden="true" />
      </Button>
      {children}
    </div>,
    dock
  );
};

/**
 * A player's card, from their avatar or name: when they joined, their
 * ratings, your record against them and how the last game went, Add friend
 * (or a challenge, from Home), and block or report. Nothing is fetched
 * until it's opened.
 *
 * Where it opens depends on the page: on phones, a sheet from the bottom of
 * the screen; beside a live game's board, over the top of the side rail, so
 * the board stays clear; anywhere else, a popover beside the name.
 */
export const PlayerPopover = ({
  player,
  showRatings = true,
  profileInNewTab = false,
  gameId,
  speed,
  canChallenge = false,
  trigger = "avatar",
  children,
}: PlayerPopoverProps) => {
  const [open, setOpen] = useState(false);
  // The report dialog lives outside the card: opening it closes the card,
  // which would take a dialog inside it along
  const [reporting, setReporting] = useState(false);
  const isMobile = useIsMobile();
  const dock = usePlayerCardDock();
  const [triggerEl, setTriggerEl] = useState<HTMLButtonElement | null>(null);
  const placement = isMobile ? "sheet" : dock ? "dock" : "popover";
  const close = useCallback(() => setOpen(false), []);
  // The block question, held here so Escape can take it back and leave the
  // card open. It doesn't outlive the card
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  if (!open && confirmingBlock) setConfirmingBlock(false);
  const cancelBlockConfirm = useCallback(() => {
    if (!confirmingBlock) return false;
    setConfirmingBlock(false);
    return true;
  }, [confirmingBlock]);
  /** For the popover and the sheet, which close on Escape by themselves */
  const keepOpenForConfirm = (event: KeyboardEvent) => {
    if (cancelBlockConfirm()) event.preventDefault();
  };
  const label = `About ${player.username}`;

  const triggerClass =
    trigger === "name"
      ? "max-w-full truncate rounded-[3px] text-left font-[inherit] underline-offset-[3px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      : "relative touch-target shrink-0 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring";
  const card = (
    <PlayerCard
      player={player}
      showRatings={showRatings}
      profileInNewTab={profileInNewTab}
      speed={speed}
      canChallenge={canChallenge}
      blockConfirm={{ open: confirmingBlock, setOpen: setConfirmingBlock }}
      onReport={() => {
        setOpen(false);
        setReporting(true);
      }}
    />
  );
  const report = (
    <ModerationDialogs
      player={player}
      action={reporting ? "report" : null}
      onClose={() => setReporting(false)}
      {...(gameId !== undefined && { gameId })}
    />
  );

  if (placement === "popover") {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label={label} className={triggerClass}>
              {children}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-72 rounded-xl p-4"
            onEscapeKeyDown={keepOpenForConfirm}
          >
            {card}
          </PopoverContent>
        </Popover>
        {report}
      </>
    );
  }

  return (
    <>
      <button
        ref={setTriggerEl}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={triggerClass}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {children}
      </button>
      {placement === "sheet" ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            onEscapeKeyDown={keepOpenForConfirm}
            className="max-h-[85svh] gap-0 overflow-y-auto rounded-t-2xl bg-card px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <SheetTitle className="sr-only">{label}</SheetTitle>
            <SheetDescription className="sr-only">
              Ratings, your record against them, and ways to add, block or report them.
            </SheetDescription>
            {card}
          </SheetContent>
        </Sheet>
      ) : (
        open &&
        dock && (
          <DockedCard dock={dock} label={label} trigger={triggerEl} onClose={close} onEscape={cancelBlockConfirm}>
            {card}
          </DockedCard>
        )
      )}
      {report}
    </>
  );
};
