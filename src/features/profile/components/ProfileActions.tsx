import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Ban,
  Check,
  ChevronDown,
  Clock,
  Eye,
  Settings,
  Swords,
  UserMinus,
  UserRoundPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ROUTES, getGameRoute } from "@/constants/routes";
import type { UserProfile } from "@/types";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { useRemoveFriend } from "@/features/friends/hooks/useRemoveFriend";
import { useSendFriendRequest } from "@/features/friends/suggestions/hooks/useSendFriendRequest";
import { useFriendRequestAction } from "@/features/friends/requests/hooks/useFriendRequestAction";
import { useFriendship } from "../hooks/useFriendship";
import { useIsBlocked, useUnblockUser } from "@/features/moderation/hooks/useBlocks";
import { PlayerModeration } from "@/features/moderation/components/PlayerModeration";

interface ProfileActionsProps {
  profile: UserProfile;
  /** The player's game in progress, if they're a friend playing right now */
  liveGameId?: number;
}

/**
 * What you can do from someone's profile, depending on how you know them:
 * Settings on your own; Add friend, the pending request, or Challenge (with
 * Remove behind the "Friends" menu) on anyone else's, each with a "more"
 * menu to block or report them. A player you've blocked shows Unblock instead.
 */
export const ProfileActions = ({ profile, liveGameId }: ProfileActionsProps) => {
  const status = useFriendship(profile);
  const { onChallenge } = useFriendActions();
  const sendRequest = useSendFriendRequest();
  const requestAction = useFriendRequestAction();
  const removeFriend = useRemoveFriend();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isBlocked = useIsBlocked(profile.id);
  const unblock = useUnblockUser();

  if (status.kind === "loading") {
    return <Skeleton className="h-10 w-full rounded-md sm:w-40" />;
  }

  if (status.kind === "self") {
    return (
      <Button asChild variant="outline" size="md">
        <Link to={ROUTES.SETTINGS}>
          <Settings aria-hidden="true" /> Settings
        </Link>
      </Button>
    );
  }

  const more = <PlayerModeration player={profile} size="md" />;

  if (isBlocked) {
    return (
      <>
        <Button
          variant="outline"
          size="md"
          disabled={unblock.isPending}
          onClick={() => unblock.mutate(profile)}
        >
          <Ban aria-hidden="true" /> Unblock
        </Button>
        {more}
      </>
    );
  }

  const watch = liveGameId !== undefined && (
    <Button asChild variant="outline" size="md">
      <Link to={getGameRoute(liveGameId)} aria-label={`Watch ${profile.username}'s game`}>
        <Eye aria-hidden="true" /> Watch live
      </Link>
    </Button>
  );

  if (status.kind === "friends") {
    return (
      <>
        {watch}
        <Button
          size="md"
          onClick={() =>
            onChallenge({
              id: profile.id,
              username: profile.username,
              avatarUrl: profile.avatarUrl ?? "",
              friendsSince: "",
              blitzRating: profile.blitzRating,
              bulletRating: profile.bulletRating,
              rapidRating: profile.rapidRating,
            })
          }
        >
          <Swords aria-hidden="true" /> Challenge
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="md" aria-label={`Friends with ${profile.username}`}>
              <Check aria-hidden="true" /> Friends
              <ChevronDown className="text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmRemove(true)}>
              <UserMinus aria-hidden="true" /> Remove friend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setConfirmRemove}
          title={`Remove ${profile.username} from your friends?`}
          description="You won't be able to challenge each other until one of you sends a new friend request."
          confirmLabel="Remove"
          destructive
          isPending={removeFriend.isPending}
          onConfirm={() =>
            removeFriend.mutate(profile.id, { onSuccess: () => setConfirmRemove(false) })
          }
        />
        {more}
      </>
    );
  }

  if (status.kind === "request-received") {
    const requestId = String(status.request.id);
    return (
      <>
        <Button
          size="md"
          disabled={requestAction.isPending}
          onClick={() => requestAction.mutate({ requestId, action: "accept" })}
        >
          <Check aria-hidden="true" /> Accept friend request
        </Button>
        <Button
          variant="outline"
          size="md"
          disabled={requestAction.isPending}
          onClick={() => requestAction.mutate({ requestId, action: "decline" })}
        >
          <X aria-hidden="true" /> Decline
        </Button>
        {more}
      </>
    );
  }

  if (status.kind === "request-sent") {
    const requestId = String(status.request.id);
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="md">
              <Clock aria-hidden="true" /> Request sent
              <ChevronDown className="text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={requestAction.isPending}
              onSelect={() => requestAction.mutate({ requestId, action: "cancel" })}
            >
              <X aria-hidden="true" /> Cancel request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {more}
      </>
    );
  }

  return (
    <>
      <Button
        size="md"
        disabled={sendRequest.isPending}
        onClick={() => sendRequest.mutate(profile.id)}
      >
        <UserRoundPlus aria-hidden="true" /> Add friend
      </Button>
      {more}
    </>
  );
};
