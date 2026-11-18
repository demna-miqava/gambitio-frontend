import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { getProfileRoute } from "@/constants/routes";
import { formatShortDate } from "@/lib/utils";
import { useBlockedUsers, useUnblockUser } from "../hooks/useBlocks";

/** The players you've blocked, each with Unblock. Shown under Privacy in Settings. */
export const BlockedPlayers = () => {
  const { data: blocked, isPending, isError, refetch } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <section aria-labelledby="blocked-players-title" className="space-y-4 border-t border-border pt-4">
      <div className="space-y-0.5">
        <h3 id="blocked-players-title" className="text-sm font-medium leading-none">
          Blocked players
        </h3>
        <p className="text-sm text-muted-foreground">
          You aren't paired with players you've blocked, and they can't challenge you, send you
          friend requests or chat with you. They aren't told.
        </p>
      </div>

      {isPending ? (
        <div className="space-y-3" role="status" aria-label="Loading blocked players">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          Couldn't load your blocked players.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : blocked.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't blocked anyone. To block someone, open their profile or tap their picture
          beside the board.
        </p>
      ) : (
        <ul className="space-y-1">
          {blocked.map((user) => (
            <li key={user.id} className="flex min-w-0 items-center gap-3 py-1.5">
              <UserAvatar src={user.avatarUrl} username={user.username} className="size-9 shrink-0" />
              <div className="min-w-0 flex-1 leading-tight">
                <Link
                  to={getProfileRoute(user.id)}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {user.username}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Blocked {formatShortDate(user.blockedAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={unblock.isPending && unblock.variables?.id === user.id}
                onClick={() => unblock.mutate(user)}
                aria-label={`Unblock ${user.username}`}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
