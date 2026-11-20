import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, SlidersHorizontal, Swords, UserRound, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { ROUTES, getProfileFriendsRoute, getProfileRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import type { FriendOpponent } from "@/types";
import { useFriendOpponents } from "@/features/friends/opponents/useFriendOpponents";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { AvatarWithPresence } from "@/features/friends/status/Presence";
import { presenceLabel, statusWord } from "@/features/friends/status/presenceLabel";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import {
  challengeTermsLine,
  describeChallengeTerms,
} from "@/features/notifications/utils/challengeLabels";
import { opponentDetail } from "@/features/friends/opponents/opponentDetail";
import { useQuickChallenge } from "@/features/create-game/hooks/useQuickChallenge";
import { getPlaySetupSearch } from "@/features/create-game/utils/setupRoute";

/** Friends fetched: as many as the widest row shows (fewer on narrower screens) */
const SHOWN = 8;
/** Avatars past these places are left out below the breakpoint: 4 on a phone, 6 up to lg */
const hiddenBelow = (index: number) => cn(index >= 4 && "max-sm:hidden", index >= 6 && "max-lg:hidden");

/**
 * One friend in the row: their avatar and name. It opens what you can do:
 * send the last challenge again (after your first one), the challenge form,
 * and their profile.
 */
const OpponentChip = ({ friend }: { friend: FriendOpponent }) => {
  const [open, setOpen] = useState(false);
  const quick = useQuickChallenge();
  const { onChallenge } = useFriendActions();
  const presence = friend.status ? { status: friend.status, gameType: friend.gameType } : null;
  const state = presence ? presenceLabel(presence) : opponentDetail(friend);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${friend.username}, ${state.charAt(0).toLowerCase()}${state.slice(1)}`}
          className="flex w-full min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-background"
        >
          <AvatarWithPresence presence={presence} announce={false}>
            <UserAvatar src={friend.avatarUrl} username={friend.username} className="size-11" />
          </AvatarWithPresence>
          <span className="w-full truncate text-center text-xs">{friend.username}</span>
          {/* Every chip has this line, so the names line up */}
          <span aria-hidden="true" className="-mt-1 h-3 text-[0.625rem] leading-none text-muted-foreground">
            {friend.status && statusWord(friend.status)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{friend.username}</p>
          <p className="truncate text-xs text-muted-foreground">
            {presence && `${presenceLabel(presence)} · `}
            {opponentDetail(friend)}
          </p>
        </div>
        {quick.label ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              setOpen(false);
              quick.send(friend);
            }}
          >
            <Swords aria-hidden="true" /> Challenge <span className="tabular-nums">{quick.label}</span>
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={() => onChallenge(friend)}>
            <Swords aria-hidden="true" /> Challenge
          </Button>
        )}
        {quick.summary && (
          <p className="-mt-1 text-center text-xs text-muted-foreground tabular-nums">{quick.summary}</p>
        )}
        <div className={cn("grid gap-2", quick.label && "grid-cols-2")}>
          {quick.label && (
            <Button variant="outline" size="sm" onClick={() => onChallenge(friend)}>
              <SlidersHorizontal aria-hidden="true" /> Options
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={getProfileRoute(friend.id)}>
              <UserRound aria-hidden="true" /> Profile
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** The challenge that is out, in the place of the friends: who, on what terms, and Cancel. */
const Waiting = () => {
  const { outgoingChallenge, cancelChallenge } = useChallenges();
  if (!outgoingChallenge) return null;
  const { username } = outgoingChallenge;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">Waiting for {username}…</p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {challengeTermsLine(describeChallengeTerms(outgoingChallenge, username, { firstColor: false }))}
          </p>
        </div>
      </div>
      <Button variant="outline" size="md" className="shrink-0" onClick={cancelChallenge}>
        Cancel
      </Button>
    </div>
  );
};

/**
 * The friends you're most likely to play, in one row on Home: the ones
 * online now, then the ones you played last. A friend opens Challenge;
 * while a challenge is out, the row is waiting on it instead.
 */
export const PlayFriend = () => {
  const { id } = useUser();
  const { friends, isLoading, isError } = useFriendOpponents({ limit: SHOWN });
  const { outgoingChallenge } = useChallenges();

  return (
    <section aria-labelledby="play-friend-title" className="rounded-2xl bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="play-friend-title" className="font-display text-2xl">
          Play a friend
        </h2>
        {friends.length > 0 && (
          <Link
            to={{ pathname: ROUTES.PLAY, search: getPlaySetupSearch("friends") }}
            className="relative touch-target shrink-0 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            All friends →
          </Link>
        )}
      </div>

      <div className="mt-3">
        {outgoingChallenge ? (
          <Waiting />
        ) : isLoading ? (
          <div className="flex gap-5 px-2 py-2" role="status" aria-label="Loading friends">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-11 rounded-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn't load your friends.</p>
        ) : friends.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Add friends to challenge them to a game.</p>
            {!!id && (
              <Button asChild variant="outline" size="md">
                <Link to={getProfileFriendsRoute(id)}>
                  <UserRoundPlus aria-hidden="true" /> Find friends
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <ul className="-mx-1 grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8">
            {friends.map((friend, index) => (
              <li key={friend.id} className={cn("min-w-0", hiddenBelow(index))}>
                <OpponentChip friend={friend} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
