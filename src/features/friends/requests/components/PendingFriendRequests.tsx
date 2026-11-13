import { usePendingFriendRequests } from "../hooks/usePendingFriendRequests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/PageHeader";
import type { FriendRequest } from "@/features/friends/types";
import { IncomingRequests } from "./IncomingRequests";
import { OutgoingRequests } from "./OutgoingRequests";
import {
  useFriendRequestAction,
  type FriendRequestAction,
} from "../hooks/useFriendRequestAction";

const CountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] font-semibold leading-none text-primary-foreground tabular-nums">
      {count}
    </span>
  ) : null;

/** Sidebar card on your own Friends tab: requests to you, and yours to others. */
export const PendingFriendRequests = () => {
  const { sentRequests, receivedRequests, isPending, isError, refetch } =
    usePendingFriendRequests();
  const { mutate, isPending: isActing } = useFriendRequestAction();

  const act = (action: FriendRequestAction) => (request: FriendRequest) =>
    mutate({ requestId: `${request.id}`, action });

  return (
    <aside className="space-y-4 self-start rounded-2xl border border-border/70 bg-card p-5">
      <SectionHeader title="Friend requests" />

      {isPending ? (
        // Tabs, then the size of the (most common) "No requests" state
        <div className="space-y-4" role="status" aria-label="Loading friend requests">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Couldn't load your friend requests.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="incoming" className="gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming" className="gap-2">
              Received <CountBadge count={receivedRequests.length} />
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              Sent
              <span className="tabular-nums text-muted-foreground">
                {sentRequests.length > 0 ? sentRequests.length : ""}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            <IncomingRequests
              requests={receivedRequests}
              onAccept={act("accept")}
              onDecline={act("decline")}
              disabled={isActing}
            />
          </TabsContent>
          <TabsContent value="outgoing">
            <OutgoingRequests
              requests={sentRequests}
              onCancel={act("cancel")}
              disabled={isActing}
            />
          </TabsContent>
        </Tabs>
      )}
    </aside>
  );
};
