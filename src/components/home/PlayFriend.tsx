import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HOME_FRIENDS_LIMIT } from "./constants";
import { Link } from "react-router-dom";
import { SlidersHorizontal, Swords, UserRound, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { getGameRoute, getProfileFriendsRoute, getProfileRoute } from "@/constants/routes";
import { FIND_PLAYER_STATE } from "@/features/friends/list/findPlayer";
import { PlayerPopover } from "@/features/profile/components/PlayerPopover";
import { sendFriendRequest } from "@/services/friends";
import { searchPlayers } from "@/services/user";
import { QKEY_PENDING_FRIEND_REQUESTS, QKEY_SUGGESTED_FRIENDS } from "@/constants/queryKeys";
import { cn, getApiErrorMessage } from "@/lib/utils";

/** The typed username isn't anyone's: said as is, unlike a failed request */
class NoSuchPlayer extends Error {}
import { useUser } from "@/hooks/useUser";
import type { FriendOpponent } from "@/types";
import { useFriendOpponents } from "@/features/friends/opponents/useFriendOpponents";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { AvatarWithPresence } from "@/features/friends/status/Presence";
import { presenceLabel } from "@/features/friends/status/presenceLabel";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import {
  challengeTermsLine,
  describeChallengeTerms,
} from "@/features/notifications/utils/challengeLabels";
import { opponentDetail } from "@/features/friends/opponents/opponentDetail";
import { useQuickChallenge } from "@/features/create-game/hooks/useQuickChallenge";

/** Friends shown: the top five by who you'd likely play (online first) */
const SHOWN = HOME_FRIENDS_LIMIT;

/**
 * One friend: avatar with their presence, the name (it opens their card),
 * what they're doing, and what you can do. Challenge opens the ways to do
 * it: send the last challenge again (after your first one), the challenge
 * form, and their profile. A friend in a game gets Watch instead. While
 * your challenge to them is out, the row says what it waits on, with Cancel.
 */
const FriendRow = ({ friend }: { friend: FriendOpponent }) => {
  const [open, setOpen] = useState(false);
  const quick = useQuickChallenge();
  const { onChallenge } = useFriendActions();
  const { outgoingChallenge, cancelChallenge } = useChallenges();
  const presence = friend.status ? { status: friend.status, gameType: friend.gameType } : null;
  const state = presence ? presenceLabel(presence) : opponentDetail(friend);
  const waiting = outgoingChallenge?.challengedId === friend.id ? outgoingChallenge : null;
  const buttonClass = "h-8 border-border-strong bg-card px-3 text-[13px] font-semibold max-sm:h-11";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-3 py-[11px] not-first:border-t not-first:border-border">
        <AvatarWithPresence presence={presence} announce={false}>
          <UserAvatar
            src={friend.avatarUrl}
            username={friend.username}
            className={cn("size-9", !presence && "opacity-70")}
          />
        </AvatarWithPresence>
        <div className="grid min-w-0 flex-1 justify-items-start leading-[1.3]">
          <span className="max-w-full truncate font-semibold">
            <PlayerPopover player={friend} trigger="name" canChallenge>
              {friend.username}
            </PlayerPopover>
          </span>
          <span className="max-w-full truncate text-[13px] text-faint" aria-live="polite">
            {waiting
              ? `Waiting for a reply, ${challengeTermsLine(
                  describeChallengeTerms(waiting, friend.username, { firstColor: false })
                )}`
              : state}
          </span>
        </div>
        {waiting ? (
          <Button variant="ghost" size="sm" className="h-8 px-3 text-[13px] font-semibold max-sm:h-11" onClick={cancelChallenge}>
            Cancel
          </Button>
        ) : friend.status === "playing" && friend.gameId !== null ? (
          <Button asChild variant="outline" size="sm" className={buttonClass}>
            <Link to={getGameRoute(friend.gameId)} aria-label={`Watch ${friend.username}'s game`}>
              Watch
            </Link>
          </Button>
        ) : (
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Challenge ${friend.username}, ${state.charAt(0).toLowerCase()}${state.slice(1)}`}
              // One challenge at a time: the one that is out has to be answered or cancelled first
              disabled={outgoingChallenge !== null}
              className={buttonClass}
            >
              Challenge
            </Button>
          </PopoverTrigger>
        )}
      </div>
      <PopoverContent align="end" className="w-64 space-y-3 p-4">
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

/**
 * Your challenge to someone who isn't among the friends listed (sent from
 * the Play page, a profile, or to a friend further down the list): who it
 * waits on and Cancel, since every Challenge button here is off until it is
 * answered. A listed friend shows the same in their own row.
 */
const WaitingElsewhere = ({ shown }: { shown: readonly FriendOpponent[] }) => {
  const { outgoingChallenge, cancelChallenge } = useChallenges();
  if (!outgoingChallenge || shown.some((friend) => friend.id === outgoingChallenge.challengedId)) return null;
  const { username } = outgoingChallenge;
  return (
    <div className="flex items-center gap-3 border-t border-border py-[11px]" role="status">
      <div className="grid min-w-0 flex-1 leading-[1.3]">
        <span className="truncate font-semibold">Waiting for {username}</span>
        <span className="truncate text-[13px] text-faint tabular-nums">
          {challengeTermsLine(describeChallengeTerms(outgoingChallenge, username, { firstColor: false }))}
        </span>
      </div>
      <Button variant="ghost" size="sm" className="h-8 px-3 text-[13px] font-semibold max-sm:h-11" onClick={cancelChallenge}>
        Cancel
      </Button>
    </div>
  );
};

/**
 * No friends yet: what the panel is for, and a field to add someone by their
 * username without leaving Home. The answer shows under the field.
 */
const AddFirstFriend = () => {
  const [username, setUsername] = useState("");
  const queryClient = useQueryClient();
  const { id: userId } = useUser();
  const request = useMutation({
    mutationFn: async (name: string) => {
      // The player search puts the name typed first when someone has it,
      // however many other names contain it
      const players = await searchPlayers(name);
      const player = players.find((found) => found.username.toLowerCase() === name.toLowerCase());
      if (!player) throw new NoSuchPlayer(`There is no player called ${name}. Check the spelling.`);
      await sendFriendRequest({ receiverId: player.id });
      return player.username;
    },
    onSuccess: () => {
      setUsername("");
      // As after any friend request: the lists that show it are out of date
      void queryClient.invalidateQueries({ queryKey: [QKEY_SUGGESTED_FRIENDS] });
      void queryClient.invalidateQueries({ queryKey: [QKEY_PENDING_FRIEND_REQUESTS, userId] });
    },
  });
  const name = username.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name) request.mutate(name);
  };

  return (
    <div className="grid content-start gap-2 pt-2 pb-4 text-sm text-muted-foreground">
      <p className="text-[15px] font-semibold text-foreground">No friends added yet</p>
      <p>Add someone by their username. Once they accept, you can challenge each other from here.</p>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <Input
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (!request.isIdle) request.reset();
          }}
          aria-label="Username"
          placeholder="Username"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 max-sm:h-11"
        />
        <Button type="submit" disabled={!name || request.isPending} className="max-sm:h-11">
          Add friend
        </Button>
      </form>
      <p className="min-h-[1.4em] font-semibold text-foreground" aria-live="polite">
        {request.isSuccess
          ? `Request sent to ${request.data}.`
          : request.isError
            ? request.error instanceof NoSuchPlayer
              ? request.error.message
              : getApiErrorMessage(request.error, "The request was not sent. Try again.")
            : ""}
      </p>
    </div>
  );
};

/**
 * The friends you're most likely to play, in a panel on Home: the ones
 * online now, then the ones you played last. As tall as the New game panel
 * beside it; the list takes the room and the footer stays at the bottom.
 */
export const PlayFriend = () => {
  const { id } = useUser();
  const { friends, isLoading, isError } = useFriendOpponents({ limit: SHOWN });
  const online = friends.filter((friend) => friend.status === "online").length;

  return (
    <section aria-labelledby="play-friend-title" className="panel flex h-full flex-col px-5 pt-5 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="play-friend-title" className="font-display text-[19px] leading-tight">
          Play a friend
        </h2>
        {online > 0 && (
          <span className="text-[13px] text-faint tabular-nums">
            {online}
            {online === SHOWN && "+"} online
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-3 py-3" role="status" aria-label="Loading friends">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="py-3 text-sm text-muted-foreground">Couldn't load your friends.</p>
        ) : friends.length === 0 ? (
          <AddFirstFriend />
        ) : (
          <>
            <ul className="flex-1">
              {friends.map((friend) => (
                <li key={friend.id}>
                  <FriendRow friend={friend} />
                </li>
              ))}
            </ul>
            <WaitingElsewhere shown={friends} />
            {!!id && (
              <div className="mt-2 flex min-h-11 items-center justify-between gap-3 border-t border-border pt-2">
                <Link
                  to={getProfileFriendsRoute(id)}
                  state={FIND_PLAYER_STATE}
                  className="-ml-1 inline-flex min-h-11 items-center gap-2 px-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <UserRoundPlus className="size-4" aria-hidden="true" />
                  Add a friend
                </Link>
                <Link
                  to={getProfileFriendsRoute(id)}
                  className="inline-flex min-h-11 items-center text-[13px] font-semibold text-primary underline-offset-[3px] hover:underline"
                >
                  All friends
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
