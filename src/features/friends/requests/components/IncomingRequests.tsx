import { Inbox } from "lucide-react";
import { FriendRequestCard } from "./FriendRequestCard";
import { EmptyState } from "@/components/EmptyState";
import type { FriendRequest } from "@/features/friends/types";

interface IncomingRequestsProps {
  requests: FriendRequest[];
  onAccept: (request: FriendRequest) => void;
  onDecline: (request: FriendRequest) => void;
  disabled?: boolean;
}

export const IncomingRequests = ({
  requests,
  onAccept,
  onDecline,
  disabled,
}: IncomingRequestsProps) => {
  if (requests.length === 0) {
    return (
      <EmptyState
        compact
        icon={Inbox}
        title="No requests"
        description="Requests other players send you show up here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {requests.map((request) => (
        <FriendRequestCard
          key={request.id}
          request={request}
          type="incoming"
          onAccept={onAccept}
          onDecline={onDecline}
          disabled={disabled}
        />
      ))}
    </ul>
  );
};
