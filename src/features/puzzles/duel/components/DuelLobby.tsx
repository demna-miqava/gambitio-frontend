import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/hooks/useUser";
import { QKEY_USER_FRIENDS } from "@/constants/queryKeys";
import { getUserFriends } from "@/services/user";
import { useDuelInvites } from "../hooks/useDuelInvites";
import type { DuelInvite, DuelPerson } from "../types";

/** Whole seconds until an invite lapses */
const useSecondsUntil = (iso: string) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000));
};

const Person = ({ person, detail, children }: { person: DuelPerson; detail?: string; children?: React.ReactNode }) => {
  const avatarSrc = useAvatarSrc();
  return (
    <li className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
      <UserAvatar src={avatarSrc(person.id, person.avatarUrl)} username={person.username} className="size-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{person.username}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
};

const Lapses = ({ invite }: { invite: DuelInvite }) => {
  const seconds = useSecondsUntil(invite.expiresAt);
  return <>{`${invite.rematchOf ? "Rematch · " : ""}lapses in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</>;
};

/** Friends to invite, searchable */
const FriendPicker = ({ onInvite, pending, invited }: { onInvite: (id: number) => void; pending: boolean; invited: Set<number> }) => {
  const { id: userId } = useUser();
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 300);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [QKEY_USER_FRIENDS, userId, "duel-picker", q],
    queryFn: () => getUserFriends(userId!, new URLSearchParams({ page: "1", limit: "20", ...(q && { q }) }).toString()),
    enabled: !!userId,
  });
  const friends = data?.data ?? [];
  return (
    <section aria-labelledby="duel-friends" className="space-y-3">
      <SectionHeader title={<span id="duel-friends">Invite a friend</span>} />
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="duel-friend-search" className="sr-only">
          Search your friends
        </label>
        <Input
          id="duel-friend-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your friends"
          className="h-10 pl-9"
          autoComplete="off"
        />
      </div>
      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading your friends">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          Couldn't load your friends.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </p>
      ) : friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? `No friend called “${q}”.` : "Duels are between friends. Add friends to invite them."}
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <Person key={friend.id} person={{ id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl }}>
              <Button
                size="sm"
                disabled={pending || invited.has(friend.id)}
                onClick={() => onInvite(friend.id)}
                aria-label={`Invite ${friend.username} to a puzzle duel`}
              >
                <Swords aria-hidden="true" />
                {invited.has(friend.id) ? "Invited" : "Invite"}
              </Button>
            </Person>
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * The duel lobby: invites waiting for you (accept or decline), the ones you
 * sent (cancel), and your friends to invite. Accepting starts the duel.
 */
export const DuelLobby = ({ onStarted }: { onStarted: (duelId: number) => void }) => {
  const invites = useDuelInvites();
  const invited = new Set(invites.outgoing.map((i) => i.to.id));

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-card p-4 sm:p-5">
      <PageHeader
        title="Puzzle duel"
        description="Race a friend through the same puzzles for three minutes. A wrong move is a strike; three and you're out. Highest score wins. No rating changes."
      />

      {invites.incoming.length > 0 && (
        <section aria-labelledby="duel-incoming" className="space-y-3">
          <SectionHeader title={<span id="duel-incoming">Invites for you</span>} />
          <ul className="space-y-2">
            {invites.incoming.map((invite) => (
              <Person key={invite.id} person={invite.from} detail={invite.rematchOf ? "Wants a rematch" : "Wants a duel"}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => invites.decline.mutate(invite.id)}
                  aria-label={`Decline ${invite.from.username}'s invite`}
                >
                  <X aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  disabled={invites.accept.isPending}
                  onClick={() => invites.accept.mutate(invite.id, { onSuccess: ({ duelId }) => onStarted(duelId) })}
                >
                  Accept
                </Button>
              </Person>
            ))}
          </ul>
        </section>
      )}

      {invites.outgoing.length > 0 && (
        <section aria-labelledby="duel-outgoing" className="space-y-3">
          <SectionHeader title={<span id="duel-outgoing">Waiting for an answer</span>} />
          <ul className="space-y-2">
            {invites.outgoing.map((invite) => (
              <Person key={invite.id} person={invite.to}>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <Lapses invite={invite} />
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => invites.cancel.mutate(invite.id)}
                  aria-label={`Cancel your invite to ${invite.to.username}`}
                >
                  Cancel
                </Button>
              </Person>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">The duel starts here as soon as they accept.</p>
        </section>
      )}

      <FriendPicker
        onInvite={(recipientId) => invites.send.mutate({ recipientId })}
        pending={invites.send.isPending}
        invited={invited}
      />
    </div>
  );
};
