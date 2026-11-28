import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/hooks/useUser";
import { cn, formatShortDate } from "@/lib/utils";
import { getProfileFriendsRoute, getProfileRoute } from "@/constants/routes";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { useIncomingChallenges } from "@/features/notifications/hooks/useIncomingChallenges";
import {
  challengeTermsLine,
  describeChallengeTerms,
} from "@/features/notifications/utils/challengeLabels";
import type { FriendRequest } from "@/features/friends/types";
import { usePendingFriendRequests } from "@/features/friends/requests/hooks/usePendingFriendRequests";
import { useFriendRequestAction } from "@/features/friends/requests/hooks/useFriendRequestAction";
import { useTableGameRequests } from "@/features/table-mode/hooks/useTableGameRequests";
import { useDuelInvites } from "@/features/puzzles/duel/hooks/useDuelInvites";
import { getPuzzleDuelRoute } from "@/constants/routes";
import { formatGameTime } from "@/utils/timeControl";

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
  note,
  children,
}: {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  detail?: ReactNode;
  /** A second line under `detail`, e.g. the opening a challenge starts from */
  note?: ReactNode;
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
        {note && <span className="block truncate text-xs text-muted-foreground">{note}</span>}
      </span>
    </Link>
    <span className="flex shrink-0 items-center gap-1.5">{children}</span>
  </li>
);

/**
 * Notifications: the bell in the top corner. Everything waiting on the
 * player, on every page: challenges, puzzle duel invites, table games to
 * confirm and friend requests, each answerable in place. The badge counts
 * them. Who is online and adding friends live with the friends themselves
 * (Home's Play a friend panel, the Play page, the profile's friends page),
 * not here. Rendered by the phone top bar and, from 768px, in the corner of
 * the page (AppLayout); not on game pages.
 */
export const NotificationsInbox = ({ className }: { className?: string }) => {
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
    isPending: requestsLoading,
    isError: requestsFailed,
    refetch,
  } = usePendingFriendRequests();
  const requestAction = useFriendRequestAction();
  const answer = (action: "accept" | "decline") => (request: FriendRequest) =>
    requestAction.mutate({ requestId: `${request.id}`, action });

  const tableGames = useTableGameRequests();
  const duels = useDuelInvites();
  const navigate = useNavigate();
  const waiting =
    challenges.length + receivedRequests.length + tableGames.requests.length + duels.incoming.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label={waiting ? `Notifications, ${waiting} waiting` : "Notifications"}
        >
          <Bell className="size-5" aria-hidden="true" />
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
        {waiting === 0 && !requestsLoading && !requestsFailed && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing is waiting on you. Challenges, duel invites and friend requests show up here.
          </p>
        )}

        {challenges.length > 0 && (
          <section className="space-y-3 p-4" aria-labelledby="inbox-challenges">
            <SectionTitle count={challenges.length}>
              <span id="inbox-challenges">Challenges</span>
            </SectionTitle>
            <ul className="space-y-2.5">
              {challenges.map((challenge) => {
                const terms = describeChallengeTerms(challenge, challenge.username);
                return (
                <Row
                  key={challenge.id}
                  userId={challenge.challengerId}
                  username={challenge.username}
                  avatarUrl={challenge.avatarUrl}
                  detail={challengeTermsLine(terms)}
                  note={terms.opening}
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
                );
              })}
            </ul>
          </section>
        )}

        {duels.incoming.length > 0 && (
          <section className="space-y-3 p-4" aria-labelledby="inbox-duels">
            <SectionTitle count={duels.incoming.length}>
              <span id="inbox-duels">Puzzle duels</span>
            </SectionTitle>
            <ul className="space-y-2.5">
              {duels.incoming.map((invite) => (
                <Row
                  key={invite.id}
                  userId={invite.from.id}
                  username={invite.from.username}
                  avatarUrl={invite.from.avatarUrl}
                  detail={invite.rematchOf ? "Wants a rematch" : "Same puzzles, 3 minutes"}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => duels.decline.mutate(invite.id)}
                    aria-label={`Decline ${invite.from.username}'s puzzle duel`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    disabled={duels.accept.isPending}
                    onClick={() =>
                      duels.accept.mutate(invite.id, {
                        onSuccess: ({ duelId }) => {
                          setOpen(false);
                          navigate(getPuzzleDuelRoute(duelId));
                        },
                      })
                    }
                    aria-label={`Accept ${invite.from.username}'s puzzle duel`}
                  >
                    Accept
                  </Button>
                </Row>
              ))}
            </ul>
          </section>
        )}

        {tableGames.requests.length > 0 && (
          <section className="space-y-3 p-4" aria-labelledby="inbox-table-games">
            <SectionTitle count={tableGames.requests.length}>
              <span id="inbox-table-games">Table games to confirm</span>
            </SectionTitle>
            <ul className="space-y-2.5">
              {tableGames.requests.map((request) => {
                const mine = request.result === `${request.color}_win`;
                const outcome = request.result === "draw" ? "drew" : mine ? "won" : "lost";
                return (
                  <Row
                    key={request.gameId}
                    userId={request.from.id}
                    username={request.from.username}
                    avatarUrl={request.from.avatarUrl}
                    detail={`You ${outcome} with ${request.color} · ${formatGameTime(request)} · ${formatShortDate(request.createdAt)}`}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={tableGames.answer.isPending}
                      onClick={() => tableGames.answer.mutate({ gameId: request.gameId, action: "decline" })}
                      aria-label={`Decline the table game ${request.from.username} saved`}
                    >
                      <X aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      disabled={tableGames.answer.isPending}
                      onClick={() => tableGames.answer.mutate({ gameId: request.gameId, action: "confirm" })}
                      aria-label={`Confirm the table game ${request.from.username} saved`}
                    >
                      Confirm
                    </Button>
                  </Row>
                );
              })}
            </ul>
          </section>
        )}

        {(requestsLoading || requestsFailed || receivedRequests.length > 0) && (
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
        )}

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
