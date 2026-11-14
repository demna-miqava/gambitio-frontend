import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import type { FriendRequest } from "@/features/friends/types";
import { getProfileRoute } from "@/constants/routes";
import { formatShortDate } from "@/lib/utils";

interface FriendRequestCardProps {
  request: FriendRequest;
  type: "incoming" | "outgoing";
  onAccept?: (request: FriendRequest) => void;
  onDecline?: (request: FriendRequest) => void;
  onCancel?: (request: FriendRequest) => void;
  disabled?: boolean;
}

/** One pending request: who, when, and Accept/Decline (or Cancel for yours). */
export const FriendRequestCard = ({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
  disabled,
}: FriendRequestCardProps) => {
  const incoming = type === "incoming";
  const user = incoming
    ? { id: request.senderId, username: request.senderUsername, avatarUrl: request.senderAvatarUrl }
    : { id: request.receiverId, username: request.receiverUsername, avatarUrl: request.receiverAvatarUrl };

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-3">
      <Link
        to={getProfileRoute(Number(user.id))}
        className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserAvatar src={user.avatarUrl} username={user.username} className="size-10 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
          <p className="text-xs text-muted-foreground">
            {incoming ? "Received" : "Sent"} {formatShortDate(request.createdAt)}
          </p>
        </div>
      </Link>

      {incoming ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onDecline?.(request)}
            aria-label={`Decline ${user.username}'s friend request`}
          >
            <X aria-hidden="true" /> Decline
          </Button>
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => onAccept?.(request)}
            aria-label={`Accept ${user.username}'s friend request`}
          >
            <Check aria-hidden="true" /> Accept
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onCancel?.(request)}
          aria-label={`Cancel your friend request to ${user.username}`}
        >
          Cancel request
        </Button>
      )}
    </li>
  );
};
