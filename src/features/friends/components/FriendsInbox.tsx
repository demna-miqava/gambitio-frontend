import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, Search, UserRoundPlus, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/hooks/useUser";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, formatShortDate } from "@/lib/utils";
import { getProfileFriendsRoute, getProfileRoute } from "@/constants/routes";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { useIncomingChallenges } from "@/features/notifications/hooks/useIncomingChallenges";
import {
  describeChallengeColor,
  describeChallengeTime,
} from "@/features/notifications/utils/challengeLabels";
import type { FriendRequest } from "../types";
import { usePendingFriendRequests } from "../requests/hooks/usePendingFriendRequests";
import { useFriendRequestAction } from "../requests/hooks/useFriendRequestAction";
import { useSendFriendRequest } from "../suggestions/hooks/useSendFriendRequest";
import {
  MIN_PLAYER_SEARCH_LENGTH,
  useSuggestedFriends,
} from "../suggestions/hooks/useSuggestedFriends";

const SectionTitle = ({ children, count }: { children: ReactNode; count?: number }) => (
  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
    {children}
    {count ? <span className="tabular-nums">{count}</span> : null}
  </h3>
);

/** One person: avatar, name, a line under it, and what you can do on the right. */
const Row = ({
  userId,
  username,
  avatarUrl,
  detail,
  children,
}: {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  detail?: ReactNode;
  children: ReactNode;
}) => (
  <li className="flex items-center justify-between gap-3">
    <Link
      to={getProfileRoute(userId)}
      className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <UserAvatar src={avatarUrl} username={username} className="size-9 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium text-foreground">{username}</span>
        {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
    </Link>
    <span className="flex shrink-0 items-center gap-1.5">{children}</span>
  </li>
);

/** Find any player by username and send them a friend request. */
const AddFriend = ({
  sent,
  received,
  onAccept,
}: {
  sent: FriendRequest[];
  received: FriendRequest[];
  onAccept: (request: FriendRequest) => void;
}) => {
  const [value, setValue] = useState("");
  const search = useDebounce(value.trim(), 300);
  const { suggestions, isFetching, isError } = useSuggestedFriends(search);
  const sendRequest = useSendFriendRequest();
  const searching = search.length >= MIN_PLAYER_SEARCH_LENGTH;

  return (
    <section className="space-y-3 p-4" aria-labelledby="inbox-add-friend">
      <SectionTitle>
        <span id="inbox-add-friend">Add a friend</span>
      </SectionTitle>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Find a player by username"
          placeholder="Find a player by username…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="pl-9"
        />
      </div>
      {searching &&
        (isError ? (
          <p className="text-sm text-muted-foreground">Couldn't search players. Try again.</p>
        ) : isFetching && suggestions.length === 0 ? (
          <div className="space-y-2" role="status" aria-label="Searching players">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one else is called “{search}”. Friends you already have aren't listed.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {suggestions.map((player) => {
              // The request ids come back as strings
              const id = String(player.id);
              const theirs = received.find((request) => String(request.senderId) === id);
              const mine = sent.some((request) => String(request.receiverId) === id);
              return (
                <Row
                  key={player.id}
                  userId={player.id}
                  username={player.username}
                  avatarUrl={player.avatarUrl}
                >
                  {theirs ? (
                    <Button
                      size="sm"
                      onClick={() => onAccept(theirs)}
                      aria-label={`Accept ${player.username}'s friend request`}
                    >
                      <Check aria-hidden="true" /> Accept
                    </Button>
                  ) : mine ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="size-3.5" aria-hidden="true" /> Request sent
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sendRequest.isPending}
                      onClick={() => sendRequest.mutate(player.id)}
                      aria-label={`Add ${player.username} as a friend`}
                    >
                      <UserRoundPlus aria-hidden="true" /> Add
                    </Button>
                  )}
                </Row>
              );
            })}
          </ul>
        ))}
    </section>
  );
};

/**
 * Friends and challenges, from one icon in the top corner: add a friend by
 * username, and answer the challenges and friend requests waiting on you.
 * The badge counts those. Rendered by the phone top bar and, from 768px, in
 * the corner of the page (AppLayout); not on game pages.
 */
export const FriendsInbox = ({ className }: { className?: string }) => {
  const { id } = useUser();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  // Following a link inside (a profile, an accepted challenge's game) closes it
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const { data: challenges = [] } = useIncomingChallenges();
  const { handleAcceptChallenge, handleDeclineChallenge } = useChallenges();
  const {
    receivedRequests,
    sentRequests,
    isPending: requestsLoading,
    isError: requestsFailed,
    refetch,
  } = usePendingFriendRequests();
  const requestAction = useFriendRequestAction();
  const answer = (action: "accept" | "decline") => (request: FriendRequest) =>
    requestAction.mutate({ requestId: `${request.id}`, action });

  const waiting = challenges.length + receivedRequests.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label={
            waiting ? `Friends and challenges, ${waiting} waiting` : "Friends and challenges"
          }
        >
          <UsersRound className="size-5" aria-hidden="true" />
          {waiting > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-medium leading-none text-primary-foreground tabular-nums"
            >
              {waiting > 9 ? "9+" : waiting}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="max-h-[min(36rem,calc(100svh-5rem))] w-[min(23rem,calc(100vw-1rem))] divide-y divide-border overflow-y-auto rounded-xl p-0"
      >
        <AddFriend sent={sentRequests} received={receivedRequests} onAccept={answer("accept")} />

        {challenges.length > 0 && (
          <section className="space-y-3 p-4" aria-labelledby="inbox-challenges">
            <SectionTitle count={challenges.length}>
              <span id="inbox-challenges">Challenges</span>
            </SectionTitle>
            <ul className="space-y-2.5">
              {challenges.map((challenge) => (
                <Row
                  key={challenge.id}
                  userId={challenge.challengerId}
                  username={challenge.username}
                  avatarUrl={challenge.avatarUrl}
                  detail={`${describeChallengeTime(challenge, challenge.username)} · ${describeChallengeColor(challenge.color)}`}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeclineChallenge(challenge.challengerId)}
                    aria-label={`Decline ${challenge.username}'s challenge`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptChallenge(challenge)}
                    aria-label={`Accept ${challenge.username}'s challenge`}
                  >
                    Accept
                  </Button>
                </Row>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3 p-4" aria-labelledby="inbox-requests">
          <SectionTitle count={receivedRequests.length}>
            <span id="inbox-requests">Friend requests</span>
          </SectionTitle>
          {requestsLoading ? (
            <Skeleton className="h-9 w-full" role="status" aria-label="Loading friend requests" />
          ) : requestsFailed ? (
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              Couldn't load your friend requests.
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : receivedRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests waiting.</p>
          ) : (
            <ul className="space-y-2.5">
              {receivedRequests.map((request) => (
                <Row
                  key={request.id}
                  userId={Number(request.senderId)}
                  username={request.senderUsername}
                  avatarUrl={request.senderAvatarUrl}
                  detail={`Sent ${formatShortDate(request.createdAt)}`}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={requestAction.isPending}
                    onClick={() => answer("decline")(request)}
                    aria-label={`Decline ${request.senderUsername}'s friend request`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    disabled={requestAction.isPending}
                    onClick={() => answer("accept")(request)}
                    aria-label={`Accept ${request.senderUsername}'s friend request`}
                  >
                    Accept
                  </Button>
                </Row>
              ))}
            </ul>
          )}
        </section>

        {id && (
          <Link
            to={getProfileFriendsRoute(id)}
            // Already there: the path doesn't change, so close it here
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
          >
            Your friends
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
};
